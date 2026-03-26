import sharp from "sharp"
import fs from "fs"

export const applyWatermark = async (inputPath) => {

  const outputPath = inputPath

  /* Get image dimensions */
  const image = sharp(inputPath)
  const metadata = await image.metadata()

  const width = metadata.width
  const height = metadata.height

  /* Dynamic watermark font size */
  const fontSize = Math.floor(width * 0.08)

  const watermarkSVG = `
    <svg width="${width}" height="${height}">
      <text
        x="50%"
        y="50%"
        dominant-baseline="middle"
        text-anchor="middle"
        font-size="${fontSize}"
        fill="white"
        opacity="0.35"
        font-family="Arial"
        font-weight="bold"
        transform="rotate(-30 ${width/2} ${height/2})"
      >
        MOTORIQ.LK
      </text>
    </svg>
  `

  const svgBuffer = Buffer.from(watermarkSVG)

  await sharp(inputPath)
    .composite([
      {
        input: svgBuffer,
        gravity: "center"
      }
    ])
    .jpeg({ quality: 90 })
    .toFile(outputPath + "_watermarked.jpg")

  /* Replace original image */
  fs.unlinkSync(inputPath)

  fs.renameSync(
    outputPath + "_watermarked.jpg",
    outputPath
  )

  return outputPath
}
