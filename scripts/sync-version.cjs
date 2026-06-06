  /**
   * 同步版本号到所有配置文件
   * 用法:
   *   node scripts/sync-version.cjs           # 从 package.json 读取版本，同步到其他文件
   *   node scripts/sync-version.cjs 1.2.3      # 将指定版本写入所有三个文件
   */
  const fs = require('fs');
  const path = require('path');

  const ROOT = path.resolve(__dirname, '..');
  const files = {
    pkg: path.join(ROOT, 'package.json'),
    tauri: path.join(ROOT, 'src-tauri', 'tauri.conf.json'),
    cargo: path.join(ROOT, 'src-tauri', 'Cargo.toml'),
  };

  // 确定版本号
  let version;
  if (process.argv[2]) {
    version = process.argv[2];
  } else {
    version = JSON.parse(fs.readFileSync(files.pkg, 'utf8')).version;
  }

  if (!/^\d+\.\d+\.\d+/.test(version)) {
    console.error('ERROR: invalid version: ' + version);
    process.exit(1);
  }

  // 更新 package.json
  let pkg = JSON.parse(fs.readFileSync(files.pkg, 'utf8'));
  pkg.version = version;
  fs.writeFileSync(files.pkg, JSON.stringify(pkg, null, 2) + '\n');
  console.log('OK package.json  -> ' + version);

  // 更新 tauri.conf.json
  let tauri = JSON.parse(fs.readFileSync(files.tauri, 'utf8'));
  tauri.package.version = version;
  fs.writeFileSync(files.tauri, JSON.stringify(tauri, null, 2) + '\n');
  console.log('OK tauri.conf.json -> ' + version);

  // 更新 Cargo.toml
    let cargo = fs.readFileSync(files.cargo, 'utf8');
    // 使用 \x22 避免引号冲突，并处理 CRLF (\r) 行尾
    let re = /^(version\s*=\s*\x22)([^\x22\r]+)(\x22)/m;
    if (!re.test(cargo)) {
      console.error('ERROR: Cargo.toml: version not found');
      process.exit(1);
    }
    let replaced = cargo.replace(re, function(m, p, v, s) { return p + version + s; });
    fs.writeFileSync(files.cargo, replaced);
    console.log('OK Cargo.toml     -> ' + version);