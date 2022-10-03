import { spawn, SpawnOptions } from 'child_process'

export const promiseSpawn = (
  cmd: string,
  args: string[],
  options: SpawnOptions = {}
) =>
  new Promise<number>((res, rej) => {
    const executeProcess = spawn(cmd, args, options)

    // executeProcess.stdout.on('data', data => {
    //   console.error(`stdout: ${data}`)
    // })

    // executeProcess.stderr.on('data', data => {
    //   console.error(`stderr: ${data}`)
    // })

    executeProcess.on('close', code => {
      if (code === 0) {
        res(code)
      } else {
        rej(`${cmd} - ${code}`)
      }
    })
  })
