const { exec } = require('child_process');
const os = require('os');
const ffi = require('ffi');

const kernel32 = ffi.Library('kernel32.dll', {
  'GetModuleHandleA': ['int32', ['string']],
  'CheckRemoteDebuggerPresent': ['bool', ['int32', 'bool']],
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
    process.exit(1);
  }
};

const isSandboxie = () => {
  if (kernel32.GetModuleHandleA('SbieDll.dll') !== 0) {
    return true;
  }
  return false;
};

const detectProcess = () => {
  for (const processName of ProcNames) {
    exec(`tasklist /FI "IMAGENAME eq ${processName}.exe"`, (error, stdout) => {
      if (!error) {
        const processList = stdout.toLowerCase();
        if (processList.includes(processName.toLowerCase())) {
          process.exit(1);
        }
      }
    });
  }
};

const runAA = () => {
  if (isVM() || isDebuggerAttached() || isSandboxie()) {
    process.exit(1);
  }

  setInterval(detectProcess, 1000); // Check every second for processes is list
};

runAA();
