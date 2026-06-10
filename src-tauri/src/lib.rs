use declarative_discord_rich_presence::activity::{ Activity, Assets };
use declarative_discord_rich_presence::DeclarativeDiscordIpcClient;
use sha2::{ Digest, Sha256 };
use std::fs;
use std::io::Write;
use std::os::windows::process::CommandExt;
use std::path::Path;
use std::path::PathBuf;
use std::process::Command;
use std::process::Stdio;
use sysinfo::{ System, SystemExt };
use tauri::Manager;
use tauri::WindowEvent;
use winapi::um::winbase::CREATE_SUSPENDED;
use reqwest::Client;
use std::sync::Arc;
use tokio::sync::Semaphore;
use std::sync::atomic::{ AtomicU64, Ordering };
use std::time::{ Duration, Instant };
use futures::stream::{ self, StreamExt };
use tokio::io::AsyncWriteExt;
use serde::{ Serialize, Deserialize };
use tauri::Window;
use tauri::Emitter;
use std::fs::File;
use std::io::Read;
use windows::Win32::Foundation::HWND;
use windows::Win32::UI::Shell::ShellExecuteA;
use windows::Win32::UI::WindowsAndMessaging::SW_SHOW;
use std::ffi::{ CString };
use windows::core::PCSTR;

const CREATE_NO_WINDOW: u32 = 0x08000000;
const BACKEND_URL: &str = env!("BACKEND_URL", "https://overpower-irritate-dealt.ngrok-free.dev");

#[tauri::command]
fn rich_presence(username: String, page: String) {
    let client = DeclarativeDiscordIpcClient::new("1510295607145795816");
    client.enable();

    let details = match page.as_str() {
        "home" => "Browsing Home",
        "library" => "Viewing Library",
        "shop" => "Browsing Item Shop",
        "settings" => "Adjusting Settings",
        _ => "Splash Launcher",
    };

    let state = if username.trim().is_empty() || username == "Guest" {
        "Not signed in".to_string()
    } else {
        format!("Signed in as: {}", username)
    };

    let _ = client.set_activity(
        Activity::new()
            .details(details)
            .state(&state)
            .assets(
                Assets::new()
                    .large_image("splash_logo")
                    .large_text("Splash Launcher")
            )
    );
}

fn download_file(url: &str, dest: &Path) -> Result<(), Box<dyn std::error::Error>> {
    if let Some(parent) = dest.parent() {
        fs::create_dir_all(parent)?;
    }
    let response = reqwest::blocking::get(url)?;
    let mut file = fs::File::create(dest)?;
    let content = response.bytes()?;
    file.write_all(&content)?;
    Ok(())
}

#[tauri::command]
fn exit_all() {
    let mut system = System::new_all();
    system.refresh_all();
    const CREATE_NO_WINDOW: u32 = 0x08000000;

    let processes = vec![
        "EpicGamesLauncher.exe",
        "FortniteLauncher.exe",
        "FortniteClient-Win64-Shipping_EAC.exe",
        "FortniteClient-Win64-Shipping.exe",
        "FortniteClient-Win64-Shipping_BE.exe",
        "EasyAntiCheat_EOS.exe",
        "EpicWebHelper.exe",
        "EACStrapper.exe"
    ];

    for process in processes.iter() {
        let mut cmd = Command::new("taskkill");
        cmd.arg("/F");
        cmd.arg("/IM");
        cmd.arg(process);
        cmd.creation_flags(CREATE_NO_WINDOW);
        cmd.spawn().unwrap();
    }
}

fn exit() {
    let mut system = System::new_all();
    system.refresh_all();
    const CREATE_NO_WINDOW: u32 = 0x08000000;

    let processes = vec![
        "EpicGamesLauncher.exe",
        "FortniteLauncher.exe",
        "FortniteClient-Win64-Shipping_EAC.exe",
        "FortniteClient-Win64-Shipping.exe",
        "FortniteClient-Win64-Shipping_BE.exe",
        "EasyAntiCheat_EOS.exe",
        "EpicWebHelper.exe",
        "EACStrapper.exe"
    ];

    for process in processes.iter() {
        let mut cmd = Command::new("taskkill");
        cmd.arg("/F");
        cmd.arg("/IM");
        cmd.arg(process);
        cmd.creation_flags(CREATE_NO_WINDOW);
        cmd.spawn().unwrap();
    }
}

#[tauri::command]
async fn check_game_exists(path: &str) -> Result<bool, String> {
    let game_path = PathBuf::from(path);
    let mut game = game_path.clone();
    game.push("FortniteGame\\Binaries\\Win64\\FortniteClient-Win64-Shipping.exe");

    if !game.exists() {
        return Err("Hmmm could not find all Fortnite files".to_string());
    } else {
        Ok(true)
    }
}

#[tauri::command]
fn experience(
    folder_path: String,
    exchange_code: String,
    is_dev: bool,
    eor: bool,
    version: String
) -> Result<bool, String> {
    exit();
    std::thread::sleep(std::time::Duration::from_secs(2));
    let game_path = PathBuf::from(folder_path);

    if version.parse::<f64>().unwrap_or(0.0) == 10.4 {
        let mut game_dll = game_path.clone();
        game_dll.push(
            "Engine\\Binaries\\ThirdParty\\NVIDIA\\NVaftermath\\Win64\\GFSDK_Aftermath_Lib.x64.dll"
        );

        if game_dll.exists() {
            loop {
                let mut game_dll2 = game_path.clone();
                game_dll2.push(
                    "Engine\\Binaries\\ThirdParty\\NVIDIA\\NVaftermath\\Win64\\GFSDK_Aftermath_Lib.x64.dll"
                );

                if std::fs::remove_file(game_dll2).is_ok() {
                    break;
                }

                std::thread::sleep(std::time::Duration::from_millis(100));
            }
        }

        let mut game_dll = game_path.clone();
        game_dll.push(
            "Engine\\Binaries\\ThirdParty\\NVIDIA\\NVaftermath\\Win64\\GFSDK_Aftermath_Lib.x64.dll"
        );

        if !is_dev {
            let _ = download_file(&format!("{}/launcher/api/redirect", BACKEND_URL), &game_dll);
        } else {
            let _ = std::fs::copy("parkieputhere", &game_dll);
        }
    } else {
        let mut game_dll1 = game_path.clone();
        game_dll1.push(
            "Engine\\Binaries\\ThirdParty\\NVIDIA\\NVaftermath\\Win64\\GFSDK_Aftermath_Lib.x64.dll"
        );

        if game_dll1.exists() {
            loop {
                let game_dll1_clone = game_dll1.clone();

                if std::fs::remove_file(&game_dll1_clone).is_ok() {
                    break;
                }

                std::thread::sleep(std::time::Duration::from_millis(100));
            }
        }

        let _ = download_file(&format!("{}/launcher/api/redirect", BACKEND_URL), &game_dll1);

        let mut game_dll2 = game_path.clone();
        game_dll2.push(
            "Engine\\Binaries\\ThirdParty\\NVIDIA\\NVaftermath\\Win64\\GFSDK_Aftermath_Lib.dll"
        );

        if game_dll2.exists() {
            loop {
                let game_dll2_clone = game_dll2.clone();

                if std::fs::remove_file(&game_dll2_clone).is_ok() {
                    break;
                }

                std::thread::sleep(std::time::Duration::from_millis(100));
            }
        }

        let _ = download_file(&format!("{}/launcher/api/redirect", BACKEND_URL), &game_dll2);
    }

    let mut game_real = game_path.clone();
    game_real.push("FortniteGame\\Binaries\\Win64\\FortniteClient-Win64-Shipping.exe");
    let mut fnlauncher = game_path.clone();
    fnlauncher.push("FortniteGame\\Binaries\\Win64\\FortniteLauncher.exe");

    let mut fnac = game_path.clone();
    fnac.push("FortniteGame\\Binaries\\Win64\\FortniteClient-Win64-Shipping_BE.exe");

    let exchange_arg = &format!("-AUTH_PASSWORD={}", exchange_code);

    let mut fort_args = vec![
        "-epicapp=Fortnite",
        "-epicenv=Prod",
        "-epiclocale=en-us",
        "-epicportal",
        "-noeac",
        "-fromfl=be",
        "-fltoken=3db3ba5dcbd2e16703f3978d",
        "-caldera=eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2NvdW50X2lkIjoiOWM1MDY1MTEwYzdhNGQ3MDk1ODYyZGE1ZWU4MTU5NjIiLCJnZW5lcmF0ZWQiOjE2NjczMjMxMzYsImNhbGRlcmFHdWlkIjoiOGFkOTEyZGYtZTcwMy00NmJhLWE2ZjQtOWM3ZGE4NjMzN2FmIiwiYWNQcm92aWRlciI6IkJhdHRsRXllIiwibm90ZXMiOiIiLCJmYWxsYmFjayI6ZmFsc2V9.m6wk19aqhW3yGrPcR3OqNwZJbwF3Bv5Dv9p-elzJwG670Xn0yb2Y2CCvkKzR9XNDX6mzgCTlo2SIpiK1Du2xNA",
        "-skippatchcheck",
        "-AUTH_LOGIN=",
        exchange_arg,
        "-AUTH_TYPE=exchangecode"
    ];

    if eor {
        fort_args.push("-eor");
    }

    if version.parse::<f64>().unwrap_or(0.0) == 10.4 {
        let mut eac = game_path.clone();
        eac.push("Solaris.exe");
        let hwnd: HWND = HWND(std::ptr::null_mut());
        let args_cstring = CString::new(fort_args.join(" ")).map_err(|e|
            format!("CString error: {}", e)
        )?;

        let exe_str = eac.to_str().ok_or("Invalid path")?;
        let exe_cstring = CString::new(exe_str).map_err(|e| format!("CString error: {}", e))?;

        let result = unsafe {
            ShellExecuteA(
                hwnd,
                PCSTR::from_raw("runas\0".as_ptr() as *const u8),
                PCSTR(exe_cstring.as_ptr() as *const u8),
                PCSTR(args_cstring.as_ptr() as *const u8),
                PCSTR::null(),
                SW_SHOW
            )
        };

        if result.is_invalid() {
            return Err("Failed to start Solaris".to_string());
        }
    } else {
        let _x = std::process::Command
            ::new(game_real)
            .creation_flags(CREATE_NO_WINDOW)
            .args(&fort_args)
            .stdout(Stdio::piped())
            .spawn()
            .map_err(|e| {
                eprintln!("Error starting Splash: {}", e);
                format!("Failed to start Splash: {}", e)
            })?;
    }

    let _fnlauncherfr = std::process::Command
        ::new(fnlauncher)
        .creation_flags(CREATE_NO_WINDOW | CREATE_SUSPENDED)
        .args(&fort_args)
        .stdout(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start Splash: {}", e));

    let _ac = std::process::Command
        ::new(fnac)
        .creation_flags(CREATE_NO_WINDOW | CREATE_SUSPENDED)
        .args(&fort_args)
        .stdout(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to start Splash: {}", e))?;

    Ok(true)
}

const BASE_URL: &str = env!("BACKEND_URL", "https://overpower-irritate-dealt.ngrok-free.dev");

#[derive(Debug, Deserialize, Clone)]
struct ManifestFile {
    path: String,
    url: String,
    size: u64,
}

#[derive(Debug, Deserialize)]
struct Manifest {
    files: Vec<ManifestFile>,
}

#[derive(Serialize)]
struct ProgressMessage {
    completed_bytes: u64,
    total_bytes: u64,
    speed_mbps: f64,
    eta_seconds: u64,
}

const CHUNK_SIZE: usize = 1024 * 1024;
const MAX_RETRIES: u32 = 3;
const MAX_CONCURRENT_DOWNLOADS: usize = 6;

async fn retry(
    client: &Client,
    url: &str,
    output_path: &Path,
    completed_bytes: &Arc<AtomicU64>
) -> Result<(), String> {
    let mut retries = 0;
    while retries < MAX_RETRIES {
        match download(client, url, output_path, completed_bytes).await {
            Ok(()) => {
                return Ok(());
            }
            Err(e) => {
                retries += 1;
                if retries == MAX_RETRIES {
                    return Err(format!("Failed after {} retries: {}", MAX_RETRIES, e));
                }
                tokio::time::sleep(Duration::from_secs(1 << retries)).await;
            }
        }
    }
    Ok(())
}

async fn download(
    client: &Client,
    url: &str,
    output_path: &Path,
    completed_bytes: &Arc<AtomicU64>
) -> Result<(), String> {
    let mut response = client
        .get(url)
        .send().await
        .map_err(|e| format!("Failed to download: {}", e))?
        .error_for_status()
        .map_err(|e| format!("Server error: {}", e))?;

    let mut file = tokio::fs::File
        ::create(output_path).await
        .map_err(|e| format!("Failed to create file: {}", e))?;

    let mut buffer = Vec::with_capacity(CHUNK_SIZE);
    while
        let Some(chunk) = response
            .chunk().await
            .map_err(|e| format!("Failed to read chunk: {}", e))?
    {
        buffer.extend_from_slice(&chunk);

        while buffer.len() >= CHUNK_SIZE {
            file
                .write_all(&buffer[..CHUNK_SIZE]).await
                .map_err(|e| format!("Failed to write chunk: {}", e))?;
            buffer.drain(..CHUNK_SIZE);
            completed_bytes.fetch_add(CHUNK_SIZE as u64, Ordering::Relaxed);
        }
    }

    if !buffer.is_empty() {
        file.write_all(&buffer).await.map_err(|e| format!("Failed to write final chunk: {}", e))?;
        completed_bytes.fetch_add(buffer.len() as u64, Ordering::Relaxed);
    }

    Ok(())
}

#[tauri::command]
async fn download_files(
    version: String,
    destination_path: String,
    window: Window
) -> Result<(), String> {
    let client = Client::builder()
        .connect_timeout(Duration::from_secs(30))
        .timeout(Duration::from_secs(300))
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let versions_url = format!("{}/versions.json", BASE_URL);
    let versions: Vec<String> = client
        .get(&versions_url)
        .send().await
        .map_err(|e| format!("Failed to fetch versions: {}", e))?
        .error_for_status()
        .map_err(|e| format!("Server error: {}", e))?
        .json().await
        .map_err(|e| format!("Failed to parse versions: {}", e))?;

    if !versions.iter().any(|v| v.contains(&version)) {
        return Err("Version not found".to_string());
    }

    let manifest_url = format!("{}/{}/{}.manifest", BASE_URL, version, version);
    let manifest: Manifest = client
        .get(&manifest_url)
        .send().await
        .map_err(|e| format!("Failed to fetch manifest: {}", e))?
        .error_for_status()
        .map_err(|e| format!("Server error: {}", e))?
        .json().await
        .map_err(|e| format!("Failed to parse manifest: {}", e))?;

    let semaphore = Arc::new(Semaphore::new(MAX_CONCURRENT_DOWNLOADS));
    let total_bytes = manifest.files
        .iter()
        .map(|f| f.size)
        .sum();
    let completed_bytes = Arc::new(AtomicU64::new(0));
    let start_time = Instant::now();

    let progress_task = {
        let completed_bytes = completed_bytes.clone();
        let window = window.clone();
        tokio::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_millis(100));
            loop {
                interval.tick().await;
                let completed = completed_bytes.load(Ordering::Relaxed);
                let progress = ((completed as f64) / (total_bytes as f64)) * 100.0;

                if progress >= 100.0 {
                    break;
                }

                let elapsed = start_time.elapsed().as_secs_f64();
                let speed = (completed as f64) / (1_048_576.0 * elapsed);
                let remaining = total_bytes - completed;
                let eta = if speed > 0.0 {
                    (remaining as f64) / (speed * 1_048_576.0)
                } else {
                    0.0
                };

                let message = ProgressMessage {
                    completed_bytes: completed,
                    total_bytes,
                    speed_mbps: speed,
                    eta_seconds: eta as u64,
                };

                if let Err(e) = window.emit("download-progress", &message) {
                    eprintln!("Failed to emit progress: {}", e);
                }
            }
        })
    };

    let download_results = stream
        ::iter(manifest.files.into_iter())
        .map(|file| {
            let client = client.clone();
            let semaphore = semaphore.clone();
            let completed_bytes = completed_bytes.clone();
            let destination_path = destination_path.clone();

            async move {
                let _permit = semaphore
                    .acquire().await
                    .map_err(|e| format!("Semaphore error: {}", e))?;
                let output_path = Path::new(&destination_path).join(&file.path);

                if let Some(parent) = output_path.parent() {
                    tokio::fs
                        ::create_dir_all(parent).await
                        .map_err(|e| format!("Failed to create dir {}: {}", parent.display(), e))?;
                }

                retry(&client, &file.url, &output_path, &completed_bytes).await
            }
        })
        .buffer_unordered(MAX_CONCURRENT_DOWNLOADS)
        .collect::<Vec<Result<(), String>>>().await;

    progress_task.abort();

    let errors: Vec<_> = download_results
        .into_iter()
        .filter_map(|r| r.err())
        .collect();

    if !errors.is_empty() {
        return Err(format!("Download errors occurred:\n{}", errors.join("\n")));
    }

    window
        .emit("download-complete", "Download complete!")
        .map_err(|e| format!("Failed to emit event: {}", e))?;

    Ok(())
}

#[tauri::command]
fn download_game_file(url: &str, dest: &str) -> Result<(), String> {
    let dest_path = Path::new(dest);
    if let Some(parent) = dest_path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let response = reqwest::blocking::get(url).map_err(|e| e.to_string())?;
    if !response.status().is_success() {
        return Err(format!("Failed to download file: {}", response.status()));
    }
    let mut file = fs::File::create(dest_path).map_err(|e| e.to_string())?;
    let content = response.bytes().map_err(|e| e.to_string())?;
    file.write_all(&content).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn get_fortnite_processid() -> Result<Option<String>, String> {
    let output = std::process::Command
        ::new("wmic")
        .creation_flags(CREATE_NO_WINDOW)
        .args(
            &[
                "process",
                "where",
                "name='FortniteClient-Win64-Shipping.exe'",
                "get",
                "ExecutablePath",
            ]
        )
        .output()
        .map_err(|e| e.to_string())?;

    let output_str = String::from_utf8_lossy(&output.stdout);

    for line in output_str.lines() {
        let trimmed = line.trim();
        if !trimmed.is_empty() && !trimmed.starts_with("ExecutablePath") {
            return Ok(Some(trimmed.to_string()));
        }
    }

    Ok(None)
}

#[tauri::command]
async fn calculate_sha256_of_file(file_path: String) -> Result<String, String> {
    let file_path = std::path::PathBuf::from(file_path);

    if !file_path.exists() {
        return Err("File does not exist".to_string());
    }
    let bytes = std::fs::read(file_path).unwrap();
    let hash = Sha256::digest(&bytes);
    return Ok(format!("{:x}", hash));
}

#[tauri::command]
async fn check_file_exists(path: &str) -> Result<bool, String> {
    let file_path = std::path::PathBuf::from(path);

    if !file_path.exists() {
        return Ok(false);
    }

    Ok(true)
}

#[tauri::command]
fn search_for_version(path: &str) -> Result<Vec<String>, String> {
    let mut file = File::open(path).map_err(|e| e.to_string())?;
    let mut buffer = Vec::new();
    file.read_to_end(&mut buffer).map_err(|e| e.to_string())?;

    let pattern = [
        0x2b, 0x00, 0x2b, 0x00, 0x46, 0x00, 0x6f, 0x00, 0x72, 0x00, 0x74, 0x00, 0x6e, 0x00, 0x69, 0x00,
        0x74, 0x00, 0x65, 0x00, 0x2b, 0x00,
    ];

    let mut matches = Vec::new();
    for (i, window) in buffer.windows(pattern.len()).enumerate() {
        if window == pattern {
            let _start = i.saturating_sub(32);
            let end = (i + pattern.len() + 64).min(buffer.len());

            let end_index = find_end(&buffer[i + pattern.len()..end]);
            if let Some(end) = end_index {
                let utf16_slice = unsafe {
                    std::slice::from_raw_parts(
                        buffer[i..i + pattern.len() + end].as_ptr() as *const u16,
                        (pattern.len() + end) / 2
                    )
                };
                let s = String::from_utf16_lossy(utf16_slice);
                matches.push(s.trim_end_matches('\0').to_string());
            }
        }
    }

    Ok(matches)
}

fn find_end(data: &[u8]) -> Option<usize> {
    let mut i = 0;
    while i + 1 < data.len() {
        if data[i] == 0 && data[i + 1] == 0 {
            return Some(i);
        }
        i += 2;
    }
    None
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri_plugin_deep_link::prepare("com.splash.launcher");

    tauri::Builder
        ::default()
        .plugin(tauri_plugin_process::init())
        // .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app
                    .handle()
                    .plugin(
                        tauri_plugin_log::Builder::default().level(log::LevelFilter::Info).build()
                    )?;
            }

            let window = app.get_webview_window("main").unwrap();

            window.on_window_event(|event| {
                match event {
                    WindowEvent::Resized(..) =>
                        std::thread::sleep(std::time::Duration::from_nanos(1)),
                    _ => {}
                }
            });

            tauri_plugin_deep_link
                ::register("splash", move |request| {
                    if let Err(err) = window.set_focus() {
                        eprintln!("Could not set focus on main window: {:?}", err);
                    }

                    let _ = window.emit("deep-link", request);
                })
                .unwrap();
            Ok(())
        })
        .invoke_handler(
            tauri::generate_handler![
                get_fortnite_processid,
                search_for_version,
                calculate_sha256_of_file,
                check_file_exists,
                check_game_exists,
                rich_presence,
                download_files,
                experience,
                download_game_file,
                exit_all
            ]
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
