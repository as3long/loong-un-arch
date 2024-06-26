// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{env, sync::Mutex};
use tauri::Manager;

struct OpenedUrls(Mutex<Option<Vec<url::Url>>>);

use chrono::Local;
use colored::Colorize;
use unrar::Archive;
use zip::read::ZipFile;
// use zip::result::ZipError;
use std::fs;
use std::io::BufReader;
use chardet::detect;
use encoding::label::encoding_from_whatwg_label;
use encoding::DecoderTrap;
use std::path::Path;
use filetime::{set_symlink_file_times, FileTime};

const TIME_FMT: &str = "%Y-%m-%d %H:%M:%S%.3f";


// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
async fn log (str: String) {
    // format!("{}", str);
    let now = Local::now().format(TIME_FMT).to_string();
    println!("{} Rust says: {}", now.green(), str);
}

#[tauri::command]
async fn rar_extract(path_str: String, to_path_str: String) -> Result<(), String> {
    let mut archive = match Archive::new(&path_str).open_for_processing() {
        Ok(archive) => archive,
        Err(e) => {
            println!("Failed to open archive: {}", e);
            return Err("打开文件失败".to_string());
        }
    };
    
    while let Some(header) = archive.read_header().unwrap() {
        archive = if header.entry().is_file() {
            match header.extract_with_base(to_path_str.clone()) {
                Ok(archive) => archive,
                Err(e) => {
                    println!("Failed to extract file: {}", e);
                    return Err("解压失败".to_string());
                }
            }
        } else {
            match header.skip() {
                Ok(archive) => archive,
                Err(e) => {
                    println!("Failed to skip file: {}", e);
                    return Err("跳过失败".to_string());
                }
            }
        };
    }
    Ok(())
}

#[tauri::command]
async fn rar_list(path_str: String) -> String {
    let mut v: Vec<String> = Vec::new();
    let archive = Archive::new(&path_str).open_for_listing().unwrap();
    for e in archive {
        let entry = e.unwrap();
        v.push(format!("{}|{}|{}", entry.filename.to_string_lossy(), entry.unpacked_size, entry.file_time));
    }
    let out =  v.join(",").to_string();
    format!("{}", out)
}

fn format_date(last_modified: zip::DateTime) -> String {
    // 提取日期时间组件，避免不必要的类型转换
    let year = last_modified.year();
    let month = last_modified.month();
    let day = last_modified.day();
    let hour = last_modified.hour();
    let minute = last_modified.minute();
    let second = last_modified.second();

    // 直接使用日期时间组件和格式化字符串构建最终的字符串
    let formatted_date = format!("{year:04}-{month:02}-{day:02} {hour:02}:{minute:02}:{second:02}", 
                                    year = year, month = month, day = day, hour = hour, 
                                    minute = minute, second = second);
    // 返回格式化后的日期时间字符串
    formatted_date
}

/**
 * 检测zip文件编码
 */
fn detect_zip(path_str: &String) -> String {
    let file = fs::File::open(path_str).unwrap();
    let reader = BufReader::new(file);

    // 组合zip的所有文件名，一起检测编码
    // 前提是我们假设 zip的每个文件名编码相同，暂时先不考虑文件名编码不同的情况
    let mut archive = zip::ZipArchive::new(reader).unwrap();
    let mut result: Vec<u8> = Vec::new();
    for i in 0..archive.len() {
        let file = archive.by_index(i).unwrap();
        result.extend_from_slice(file.name_raw());
    }
    let charset = detect(&result);
    let charset2enc_str = match charset.0.as_str() {
        "CP932" => "windows-31j",
        "CP949" => "windows-949",
        "MacCyrillic" => "x-mac-cyrillic",
        "" => "GBK",
        _ => charset.0.as_str(),
    }.to_string();
    return charset2enc_str;
}

fn u82str(file: &ZipFile, charset: &str) -> String {
    let name_raw = file.name_raw();
    
    let coder = encoding_from_whatwg_label(charset);
    let name = match coder {
        Some(coding) => coding.decode(name_raw, DecoderTrap::Ignore).unwrap_or_else(|_| "解码失败".to_string()),
        None => file.name().to_string()
    };
    return name;
}

#[tauri::command]
async fn zip_list(path_str: String) -> String {
    let mut v: Vec<String> = Vec::new();
    let file = fs::File::open(path_str.clone()).unwrap();
    let reader = BufReader::new(file);

    let mut archive = zip::ZipArchive::new(reader).unwrap();
    let charset = detect_zip(&path_str);
    println!("zip_list {}", charset);
    for i in 0..archive.len() {
        let file = archive.by_index(i).unwrap();
        let last_modified = file.last_modified();
        v.push(format!("{}|{}|{}", u82str(&file, charset.as_str()), file.size(), format_date(last_modified)))
    }
    let out =  v.join(",").to_string();
    format!("{}", out)
}

#[tauri::command]
async fn zip_extract(path_str: String, to_path_str: String) -> Result<(), String> {
    // let detect_zip_path_str = path_str.clone();
    let charset = detect_zip(&path_str);
    let file = fs::File::open(path_str).unwrap();
    let reader = BufReader::new(file);
    let outdir_path = Path::new(&to_path_str);

    let mut archive = zip::ZipArchive::new(reader).unwrap();
    
    for i in 0..archive.len() {
        let mut file = archive.by_index(i).unwrap();
        let name = u82str(&file, charset.as_str());
        let filepath = Path::new(&name);
        let outpath = outdir_path.join(filepath);

        if file.name().ends_with('/') {
            let _ = fs::create_dir_all(&outpath);
        } else {
            if let Some(p) = outpath.parent() {
                if !p.exists() {
                    fs::create_dir_all(p).expect("Failed to create directory");
                }
            }
            let mut outfile = fs::File::create(&outpath).unwrap();
            std::io::copy(&mut file, &mut outfile).unwrap();
        }

        let tm = file.last_modified().to_time().unwrap();
        let tm2 = FileTime::from_unix_time(tm.unix_timestamp(), tm.nanosecond());
        let _ = set_symlink_file_times(&outpath, tm2, tm2);

        // Get and Set permissions
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            if let Some(mode) = file.unix_mode() {
                fs::set_permissions(&outpath, fs::Permissions::from_mode(mode)).unwrap();
            }
        }
    }
    Ok(())
}



fn main() {
    tauri::Builder::default()
        .manage(OpenedUrls(Default::default()))
        .setup(|app| {
            #[cfg(any(windows, target_os = "linux"))]
            {
              // NOTICE: `args` may include URL protocol (`your-app-protocol://`) or arguments (`--`) if app supports them.
              let mut urls = Vec::new();
              for arg in env::args().skip(1) {
                if let Ok(url) = url::Url::parse(&arg) {
                  urls.push(url);
                }
              }
      
              if !urls.is_empty() {
                app.state::<OpenedUrls>().0.lock().unwrap().replace(urls);
              }
            }
      
            let opened_urls = if let Some(urls) = &*app.state::<OpenedUrls>().0.lock().unwrap() {
              urls
                .iter()
                .map(|u| u.as_str().replace("\\", "\\\\"))
                .collect::<Vec<_>>()
                .join(", ")
            } else {
              "".into()
            };
            
            println!("opened_urls {}", opened_urls);

            // tauri::WindowBuilder::new(app, "main", Default::default())
            //   .initialization_script(&format!("window.openedUrls = `{opened_urls}`;console.log(`{opened_urls}`);"))
            //   .build()
            //   .unwrap();
            let _ = app.get_window("main").unwrap().eval(&format!("window.openedUrls = decodeURIComponent('{opened_urls}');console.log(decodeURIComponent('{opened_urls}'));"));

            Ok(())
          })
        .invoke_handler(tauri::generate_handler![log, rar_extract, rar_list, zip_list, zip_extract])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
