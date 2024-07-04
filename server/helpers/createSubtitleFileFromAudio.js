const fs = require('fs');
const transcriptdata = require('./transcriptdata');

function formatTime(seconds) {
  const date = new Date(seconds * 1000).toISOString().substr(11, 12);
  return date.replace('.', ',');
}

async function createSubtitleFileFromAudio(audioFilePath, subtitleFilePath) {
  const transcription = transcriptdata;
  let srtContent = '';
  let index = 1;
  let phrase = '';
  let start = 0;
  let end = 0;

  transcription.results.channels[0].alternatives[0].words.forEach((wordInfo, i) => {
    if (phrase.length === 0) {
      start = wordInfo.start;
    }
    phrase += `${wordInfo.word} `;
    end = wordInfo.end;

    // Group words into phrases or when reaching a certain duration
    if (phrase.split(' ').length >= 5 || (end - start) >= 2 || i === transcription.results.channels[0].alternatives[0].words.length - 1) {
      srtContent += `${index}\n`;
      srtContent += `${formatTime(start)} --> ${formatTime(end)}\n`;
      srtContent += `${phrase.trim()}\n\n`;
      index++;
      phrase = '';
    }
  });

  fs.writeFileSync(subtitleFilePath, srtContent);
}

module.exports = createSubtitleFileFromAudio;
