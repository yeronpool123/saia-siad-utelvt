import { execFileSync } from 'node:child_process';

const KILLED_OK = 'terminadas por PREDEV';

const run = () => {
  if (process.platform !== 'win32') {
    console.log('PREDEV: limpieza solo aplica a Windows. Omitiendo.');
    return;
  }

  let pids = [];
  try {
    const ps = execFileSync(
      'powershell.exe',
      [
        '-NoProfile',
        '-Command',
        "Get-CimInstance Win32_Process -Filter \"Name = 'node.exe'\" | Where-Object { $_.CommandLine -match 'sarci-sistema' -and ($_.CommandLine -match 'src[/\\\\]index\\\\.js' -or $_.CommandLine -match 'nodemon') } | Select-Object -ExpandProperty ProcessId",
      ],
      { encoding: 'utf8' }
    );
    pids = ps
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter((s) => /^\d+$/.test(s));
  } catch (err) {
    console.warn(`PREDEV: no se pudo inspeccionar procesos (${err.message}).`);
  }

  if (pids.length === 0) {
    console.log('PREDEV: sin instancias previas del backend. Listo.');
    return;
  }

  for (const pid of pids) {
    try {
      execFileSync('taskkill.exe', ['/PID', pid, '/T', '/F'], { stdio: 'ignore' });
    } catch {
      // el proceso ya no existe
    }
  }
  console.log(`PREDEV: ${KILLED_OK} (PID: ${pids.join(', ')})`);
};

run();