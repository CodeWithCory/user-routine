async function runSpaChecks() {
  await spaCheck([    
    'log Tests starting',
    'val input[type="text"] Hello, world!',
    'val input[type="number"] 20',
    'click button',
    'exists pre hello',
    'write #far-down Back up we go!',
    'nav #',
    'log Next are custom functions',
    () => { console.log('This is logging from a custom function, next is a custom async function!') },
    async () => { await new Promise(resolve => setTimeout(() => { resolve() }, 300)) },
    'click button long process',
    'await .output process complete',
  ], { message: 'Testing features', globalDelay: 100 });

  await spaCheck([
    'log Expect success: false',
    'click does-not-exist',
    'invalidkeyword test',
    () => { throw new Error('This function should error') },
    'await does-not-exist',
    'await body>main this text should not exist anywhere'
  ], {
    message: 'Testing error handling',
    continueOnFailure: true, awaitTimeout: 600, globalDelay: 50
  });

  await spaCheck([
    'log Expect success: false, should halt after next error',
    'click does-not-exist',
    'log If you see this, it did not work',
  ], { message: 'Testing graceful fail', globalDelay: 50 });

  await spaCheck([
    'append #progress  Done! Check the browser console for results.',
    'log All done!',
  ], { globalDelay: 0, logProgress: false, logResult: false });

  console.log('Done! See above for results.');
}
runSpaChecks();