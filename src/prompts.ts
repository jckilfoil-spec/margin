// Reflection prompts surfaced by PromptButton. Static for v1; v2 may pull
// from a user-editable file. Order is irrelevant — selection is random.

export const PROMPTS: readonly string[] = [
  "What's draining your energy this week?",
  'What did you learn yesterday that surprised you?',
  'If you only do one thing today, what would matter most?',
  "What's a decision you've been postponing? Why?",
  'Who in your life have you not thanked recently?',
  'What does your future self need from you right now?',
  "What's a belief you held last year that you no longer hold?",
  "Where are you spending time that doesn't compound?",
  "What's one thing that felt heavy this week — and is it still heavy?",
  "What would you build if you couldn't fail?",
  'When did you last feel proud of yourself? What for?',
  "What's the smallest version of your big idea?",
  "Who's living the life you want — what are they doing differently?",
  "What's a problem you keep trying to think your way out of?",
  "What's something you've been avoiding writing down?",
  'If you had a free hour today, where would it go?',
  "What's your relationship with rest right now?",
  "What's a recurring frustration — and what's the root cause?",
  'What did your body tell you today that you ignored?',
  "What's a goal you've outgrown but haven't released?",
  "Who deserves a 'thinking of you' message right now?",
  "What's the next 10% on the project you care most about?",
  "What did you say yes to this week that you should've declined?",
  "What's a small win from yesterday worth re-noticing?",
  'If today were a chapter title, what would it be?',
  "What's making you feel alive lately?",
  "What's a question you've been afraid to ask?",
  'Who do you want to be in five years — and what would they do today?',
  "What's a story you're telling yourself that might not be true?",
  'What would you do if you trusted your instincts more?',
];

export function randomPrompt(): string {
  // PROMPTS is constant and non-empty, so the indexed access is always valid.
  // The non-null assertion is the cleanest way to express that without an
  // exception-throwing fallback that can never run.
  const idx = Math.floor(Math.random() * PROMPTS.length);
  return PROMPTS[idx]!;
}
