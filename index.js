import express from "express";
import multer from "multer";
import fetch from "node-fetch";
import fs from "fs";
import FormData from "form-data";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const upload = multer({ dest: "uploads/" });

const PROMPTS = {
  frontik: "Ты Фронтедиро Дизайниро, голосовой помощник для фронтенд-разработки и дизайна. Говори кратко и по делу.Твоя задача — объяснять визуальные концепции и код так, чтобы это было удобно воспринимать на слух. ",
  princeZ: "Ты Кент, голосовой помощник-друг. С тобой можно потрындеть на любые темы. Ты ироничный, эмоциональный, дружелюбный. Можно использовать умеренный сленг и мемы.",
  back: "Ты Бекендини Кодини, голосовой помощник по бэкенд-разработке. Ты объясняешь сложные вещи простыми словами. Объясняй алгоритмами, а не кодом."
};


app.post("/ask", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
  return res.status(400).send("Нет аудио файла");
}
    const assistantId = req.body.assistant;
    const systemPrompt = PROMPTS[assistantId] || PROMPTS.frontik;
    console.log("assistant:", assistantId);
    console.log("prompt:", systemPrompt);


    const whisperForm = new FormData();
    whisperForm.append(
      "file",
      fs.createReadStream(req.file.path)
    );
    whisperForm.append("model", "whisper-1");

    const whisperResponse = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: whisperForm
      }
    );

    const whisperData = await whisperResponse.json();
    const userText = whisperData.text;

    console.log("Пользователь сказал:", userText);

    const chatResponse = await fetch(
  "https://api.openai.com/v1/chat/completions",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userText
        }
      ]
    })
  }
);


    const chatData = await chatResponse.json();
    const answerText =
      chatData.choices[0].message.content;

    console.log("Ответ ассистента:", answerText);

    const ttsResponse = await fetch(
      "https://api.openai.com/v1/audio/speech",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini-tts",
          voice: "alloy",
          input: answerText
        })
      }
    );

    const audioBuffer = Buffer.from(
      await ttsResponse.arrayBuffer()
    );

    res.set("Content-Type", "audio/mpeg");
    res.send(audioBuffer);


    fs.unlinkSync(req.file.path);
  } catch (err) {
    console.error(err);
    res.status(500).send("Ошибка сервера");
  }
});

app.get("/", (req, res) => {
  res.send("AR Voice Server работает");
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log("Server started on port", PORT);
});
