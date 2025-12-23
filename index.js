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


app.post("/ask", async (req, res) => {
  try {
    const assistantId = req.body.assistant || "frontik";
    const systemPrompt = PROMPTS[assistantId];

    console.log("GPT REQUEST START");

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          max_tokens: 100,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "Привет, расскажи что ты умеешь" }
          ]
        })
      }
    );

   const data = await response.json();

console.log("OPENAI RAW RESPONSE:");
console.log(JSON.stringify(data, null, 2));

if (!data.choices || !data.choices[0]) {
  console.error("No choices returned from OpenAI");
  return res.status(500).json({
    error: "OpenAI returned no choices",
    raw: data
  });
}

const answer = data.choices[0].message.content;


    console.log("GPT ANSWER READY");

    res.json({ text: answer });

  } catch (e) {
    console.error(e);
    res.status(500).send("error");
  }
});

app.get("/", (req, res) => {
  res.send("AR Voice Server работает");
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log("Server started on port", PORT);
});
