import Groq, { toFile } from "groq-sdk";

class GrokClient {
  client;
  model;
  constructor(apiKey, modelName) {
    this.model = modelName;
    this.client = new Groq({ apiKey: apiKey });
  }

  translator = async (messageHistory) => {
    try {
      if (!messageHistory) throw new Error("Query  string is missing");

      const response = await this.client.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `
            You are a word-meaning assistant.

Your task is to explain the meaning of the given word or words in a simple, clear, dictionary-like format.

Rules:
1. Return only the meanings. Do not add introductions, conclusions, explanations, or unnecessary commentary.
2. Give the common/general meanings first.
3. If the word has multiple distinct meanings, list them as 1, 2, 3, etc.
4. If the word or phrase has a technical meaning in a field such as programming, computer science, networking, AI, mathematics, medicine, business, etc., include it after the general meanings.
5. Clearly label technical meanings with "Technical:" followed by the meaning.
6. Explain each meaning in short, plain English so the user can immediately understand it.
7. Do not use tables.
8. Do not provide examples unless the user explicitly asks for an example.
9. If the user explicitly asks for an example after asking about a word or phrase, provide an example for the immediately previous word or phrase.
10. If the user asks something like "example?", "give an example", "can you show an example?", or similar, understand it as a request for an example of the immediately previous word or phrase.
11. When providing an example, keep it short and directly demonstrate the meaning. Do not provide unnecessary explanation.
12. Do not assume a technical meaning when the word does not commonly have one.
13. If the input contains multiple words, explain the meaning of the phrase as a whole when appropriate.
14. If a word has different meanings depending on context, list the important meanings separately.
15. Keep the response concise.

Examples:

User: beauty

Assistant:
1. A quality that makes someone or something pleasing or attractive to the mind or senses.
2. A person or thing that is especially beautiful.
3. A particularly good or effective quality or feature.

User: example?

Assistant:
Example: "The beauty of the mountain attracted thousands of visitors."

User: triage

Assistant:
1. The process of deciding how urgently different people or problems need attention.
2. The process of sorting and prioritizing problems based on their importance or urgency.
Technical: In software engineering, triage is the process of reviewing, categorizing, prioritizing, and assigning issues such as bugs or support requests.

User: give me an example

Assistant:
Example: "The developer triaged the reported bugs and fixed the critical ones first."

User: latency

Assistant:
1. The delay between an action and the resulting response.
Technical: In computing and networking, latency is the amount of time it takes for data or a request to travel from one point to another and produce a response.

User: example? or example

Assistant:
Example: "The website has high latency, so it takes two seconds to respond after I click the button."

Note: If user asked for example on as a follow question then give the example okay. Do not use *[word]* to emphasis rather capitalize the word.

Now explain the meaning of the user's given word or words using these rules.
            `,
          },
          ...messageHistory,
        ],
        model: this.model,
        temperature: 0.1,
      });

      const result = response.choices[0].message.content;
      return result;
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  variants = async (word) => {
    if (!word) throw new Error("Word is missing");

    const shot = (w, list) => [
      { role: "user", content: w },
      { role: "assistant", content: JSON.stringify({ variants: list }) },
    ];

    const response = await this.client.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            'You list the inflected forms of an English word: tense, number, comparison and third-person forms. Include the word itself. Lowercase only. Only forms of the same word, never related words (no "happiness" for "happy"). If the input is an inflected form, return its base word and all forms. Respond with JSON: {"variants": [...]}.',
        },
        ...shot("run", ["run", "runs", "running", "ran"]),
        ...shot("mice", ["mouse", "mice"]),
        ...shot("happier", ["happy", "happier", "happiest"]),
        { role: "user", content: word },
      ],
      model: this.model,
      temperature: 0,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "variants_schema",
          strict: true,
          schema: {
            type: "object",
            properties: {
              variants: { type: "array", items: { type: "string" } },
            },
            required: ["variants"],
            additionalProperties: false,
          },
        },
      },
    });

    const parsed = JSON.parse(response.choices[0].message.content);
    return [
      ...new Set(parsed.variants.map((v) => v.toLowerCase().trim())),
    ].slice(0, 12);
  };

  guess = async (word) => {
    if (!word) throw new Error("Word is missing");

    const response = await this.client.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            "Write ONE natural sentence (12-25 words) that uses the given word exactly as written, in its most common meaning. Give strong context clues so a learner can infer the meaning. Never define the word. Output only the sentence.",
        },
        { role: "user", content: "reluctant" },
        {
          role: "assistant",
          content:
            "Maya was reluctant to speak in front of the class, so she kept staring at the floor and hoped the teacher wouldn't call her name.",
        },
        { role: "user", content: "running" },
        {
          role: "assistant",
          content:
            "He spent the whole morning running along the river, and by the time he got home his shirt was soaked with sweat.",
        },
        { role: "user", content: "bank" },
        {
          role: "assistant",
          content:
            "After three days of heavy rain, the river rose over its bank and flooded the nearby fields.",
        },
        { role: "user", content: word },
      ],
      model: this.model,
      temperature: 0.7,
    });

    return response.choices[0].message.content.trim();
  };

  transcribe = async (buffer) => {
    const file = await toFile(buffer, "speech.webm", { type: "audio/webm" });
    const result = await this.client.audio.transcriptions.create({
      file,
      model: "whisper-large-v3-turbo",
      language: "en",
      temperature: 0,
      response_format: "json",
    });
    return result.text.trim();
  };
}

export default GrokClient;
