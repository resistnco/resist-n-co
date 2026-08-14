import type { Lang } from "./i18n";

export interface ProductTranslation {
  name: string;
  description: string;
}

// Keyed by product slug. If a slug is missing, the original French name/description is used.
export const productTranslations: Record<string, { en: ProductTranslation }> = {
  "tshirt-resist": {
    en: {
      name: 'T-Shirt "Resist"',
      description: "Raised fist holding a green sprout, text RESIST. White and red DTG print. A manifesto to wear.",
    },
  },
  "tshirt-antifascist": {
    en: {
      name: 'T-Shirt "Antifascist Action"',
      description: "Three arrows of antifascism, bold and clear. For those who stand against fascism in all its forms.",
    },
  },
  "tshirt-solidarity": {
    en: {
      name: 'T-Shirt "Solidarity"',
      description: "Two hands joined in solidarity, text SOLIDARITY. A message of unity and mutual aid.",
    },
  },
  "hoodie-climate": {
    en: {
      name: 'Hoodie "Climate Justice"',
      description: "Globe with a fist, text CLIMATE JUSTICE. For climate activists who don't back down.",
    },
  },
  "hoodie-nopasaran": {
    en: {
      name: 'Hoodie "No Pasarán"',
      description: "Iconic antifascist slogan NO PASARÁN. They shall not pass. A cry of resistance that echoes through history.",
    },
  },
  "tuque-power": {
    en: {
      name: 'Beanie "Power to the People"',
      description: "Raised fist, text POWER TO THE PEOPLE. Warm beanie for cold days of struggle.",
    },
  },
  "mug-defend": {
    en: {
      name: 'Mug "Defend the Earth"',
      description: "Globe in hands, text DEFEND THE EARTH. 15oz ceramic mug for your morning brew of resistance.",
    },
  },
  "coaster-organize": {
    en: {
      name: 'Coaster "Organize"',
      description: "Text ORGANIZE. Cork coaster for your drinks and your meetings.",
    },
  },
  "tshirt-bye-don": {
    en: {
      name: 'T-Shirt "Bye Don"',
      description: "Goodbye Donald. A celebratory design for the end of an era of chaos.",
    },
  },
  "tshirt-tiny-hands": {
    en: {
      name: 'T-Shirt "Tiny Hands, Giant Lies"',
      description: "Small hands, big lies. A satirical design that says it all.",
    },
  },
  "tshirt-covfefe": {
    en: {
      name: 'T-Shirt "Covfefe Resistance Dept."',
      description: "Department of Covfefe Resistance. When nonsense becomes resistance.",
    },
  },
  "tshirt-fact-check": {
    en: {
      name: 'T-Shirt "Fact Check the Feed"',
      description: "Verify before sharing. A design for critical thinkers in the age of misinformation.",
    },
  },
  "tshirt-no-planet-b": {
    en: {
      name: 'T-Shirt "No Planet B"',
      description: "Earth with text NO PLANET B. We only have one planet. Protect it.",
    },
  },
  "hoodie-no-kings": {
    en: {
      name: 'Hoodie "No Kings, No Con Men"',
      description: "No kings, no con men. A clear message against autocracy and grifters.",
    },
  },
  "hoodie-grift-alert": {
    en: {
      name: 'Hoodie "Grift Alert"',
      description: "Grift alert! When the con is obvious, sound the alarm.",
    },
  },
  "hoodie-not-my-circus": {
    en: {
      name: 'Hoodie "Not My Circus"',
      description: "Not my circus, not my monkeys. Sometimes you have to step back from the chaos.",
    },
  },
  "hoodie-keep-oil-ground": {
    en: {
      name: 'Hoodie "Keep Oil in the Ground"',
      description: "Keep oil in the ground. For a future beyond fossil fuels.",
    },
  },
  "hoodie-memes-evidence": {
    en: {
      name: 'Hoodie "Memes Aren\'t Evidence"',
      description: "Memes are not evidence. A reminder in the age of viral disinformation.",
    },
  },
  "tuque-truth-matters": {
    en: {
      name: 'Beanie "Truth Matters"',
      description: "Truth matters. A simple, powerful statement for your head.",
    },
  },
  "tuque-question-everything": {
    en: {
      name: 'Beanie "Question Everything"',
      description: "Question everything. Critical thinking starts with a question.",
    },
  },
  "tuque-resist-every-day": {
    en: {
      name: 'Beanie "Resist Every Day"',
      description: "Resist every day. Resistance is a daily practice.",
    },
  },
  "mug-resist-every-day": {
    en: {
      name: 'Mug "Resist Every Day"',
      description: "Resist every day. Start your morning with a cup of conviction.",
    },
  },
  "coaster-organize-mobilize": {
    en: {
      name: 'Coaster "Organize Mobilize"',
      description: "Organize, mobilize. Two words, one movement.",
    },
  },
  "tote-no-planet-b": {
    en: {
      name: 'Tote "No Planet B"',
      description: "Earth protected by hands, text NO PLANET B. Eco-friendly recycled cotton tote bag.",
    },
  },
  "tshirt-eyes-of-resistance": {
    en: {
      name: 'T-Shirt "Eyes of Resistance"',
      description: "Eyes that see everything, a message that won't be silenced. Bold streetwear design for those who refuse willful blindness. High-quality DTG print.",
    },
  },
  "tshirt-torn-paper-revolt": {
    en: {
      name: 'T-Shirt "Torn Paper Revolt"',
      description: "Torn collage, visual manifesto. Punk-zine aesthetic for a resistance that makes itself seen. Every tear is a voice that refuses silence.",
    },
  },
  "tshirt-framed-dissent": {
    en: {
      name: 'T-Shirt "Framed Dissent"',
      description: "Framed but not contained. Dissent in a frame, art as political act. Collage design for message carriers.",
    },
  },
  "tshirt-fists-of-solidarity": {
    en: {
      name: 'T-Shirt "Fists of Solidarity"',
      description: "Fists raised, solidarity affirmed. Hardcore design for a shared struggle. Unity is strength, the fist is the message.",
    },
  },
  "hoodie-eyes-of-resistance": {
    en: {
      name: 'Hoodie "Eyes of Resistance"',
      description: "Eyes that see everything, a message that won't be silenced. Bold streetwear design for those who refuse willful blindness. High-quality DTG print.",
    },
  },
  "hoodie-torn-paper-revolt": {
    en: {
      name: 'Hoodie "Torn Paper Revolt"',
      description: "Torn collage, visual manifesto. Punk-zine aesthetic for a resistance that makes itself seen. Every tear is a voice that refuses silence.",
    },
  },
  "hoodie-framed-dissent": {
    en: {
      name: 'Hoodie "Framed Dissent"',
      description: "Framed but not contained. Dissent in a frame, art as political act. Collage design for message carriers.",
    },
  },
  "hoodie-fists-of-solidarity": {
    en: {
      name: 'Hoodie "Fists of Solidarity"',
      description: "Fists raised, solidarity affirmed. Hardcore design for a shared struggle. Unity is strength, the fist is the message.",
    },
  },
};

/**
 * Returns the localized product name and description.
 * Falls back to the original (French) values if no translation exists.
 */
export function localizeProduct(
  product: { name: string; slug: string; description: string },
  lang: Lang
): { name: string; description: string } {
  if (lang !== "en") return { name: product.name, description: product.description };
  const t = productTranslations[product.slug];
  if (t) return t.en;
  return { name: product.name, description: product.description };
}
