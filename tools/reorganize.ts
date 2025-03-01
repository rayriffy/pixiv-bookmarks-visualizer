import fs from 'node:fs'
import path from 'node:path'

const illustsCacheDirectory = path.join(__dirname, '../.next/cache/pixivProxy')

const dividerGroup = 1000000

fs.readdirSync(illustsCacheDirectory)
  .filter(o => fs.statSync(path.join(illustsCacheDirectory, o)).isFile())
  .filter(o => Number.isSafeInteger(Number(o.split('_')[0])))
  .map(file => {
    const sourcePath = path.join(illustsCacheDirectory, file)
    const groupName = Math.floor(
      Number(file.split('_')[0]) / dividerGroup
    ).toString()

    const targetDirectory = path.join(illustsCacheDirectory, groupName)
    if (!fs.existsSync(targetDirectory))
      fs.mkdirSync(targetDirectory, {
        recursive: true,
      })
    const targetPath = path.join(targetDirectory, file)

    fs.renameSync(sourcePath, targetPath)
  })
