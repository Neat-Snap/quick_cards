import * as SimpleIcons from 'simple-icons';

/**
 * Utility functions for working with skill icons
 */

// Map of common technology names to their Simple Icons slugs
const ICON_MAP: Record<string, string> = {
  // Programming Languages
  "javascript": "javascript",
  "js": "javascript", 
  "typescript": "typescript",
  "ts": "typescript",
  "python": "python",
  "java": "java",
  "c++": "cplusplus",
  "c#": "csharp",
  "php": "php",
  "ruby": "ruby",
  "swift": "swift",
  "golang": "go",
  "go": "go",
  
  // Frameworks & Libraries
  "react": "react",
  "react.js": "react",
  "angular": "angular",
  "vue": "vuedotjs",
  "vue.js": "vuedotjs",
  "node.js": "nodedotjs",
  "node": "nodedotjs",
  "express": "express",
  "django": "django",
  "flask": "flask",
  "spring": "spring",
  "spring boot": "springboot",
  "laravel": "laravel",
  "jquery": "jquery",
  "bootstrap": "bootstrap",
  "tailwind": "tailwindcss",
  "tailwindcss": "tailwindcss",
  
  // Databases
  "mysql": "mysql",
  "postgresql": "postgresql",
  "postgres": "postgresql",
  "mongodb": "mongodb",
  "redis": "redis",
  "sqlite": "sqlite",
  "firebase": "firebase",
  "supabase": "supabase",
  
  // Design Tools
  "figma": "figma",
  "adobe photoshop": "adobephotoshop",
  "photoshop": "adobephotoshop",
  "illustrator": "adobeillustrator",
  "adobe illustrator": "adobeillustrator",
  "sketch": "sketch",
  "adobe xd": "adobexd",
  "xd": "adobexd",
  "indesign": "adobeindesign",
  "adobe indesign": "adobeindesign",
  
  // Version Control & DevOps
  "git": "git",
  "github": "github",
  "gitlab": "gitlab",
  "docker": "docker",
  "kubernetes": "kubernetes",
  "aws": "amazonaws",
  "amazon web services": "amazonaws",
  "google cloud": "googlecloud",
  "azure": "microsoftazure",
  "terraform": "terraform",
  "jenkins": "jenkins",
  "circleci": "circleci",
  "travis ci": "travisci",
  
  // Mobile
  "android": "android",
  "ios": "ios",
  "react native": "reactnative",
  "flutter": "flutter",
  "ionic": "ionic",
  "xamarin": "xamarin",
  
  // Other technologies
  "html": "html5",
  "html5": "html5",
  "css": "css3",
  "css3": "css3",
  "sass": "sass",
  "less": "less",
  "webpack": "webpack",
  "vite": "vite",
  "graphql": "graphql",
  "wordpress": "wordpress",
  "shopify": "shopify",
  "woocommerce": "woocommerce",
  "jira": "jira",
  "confluence": "confluence",
  "slack": "slack",
  "notion": "notion",
  
  // 3D and Design
  "blender": "blender",
  "unity": "unity",
  "unreal engine": "unrealengine",
  "autocad": "autodesk",
  "fusion 360": "autodesk"
};

/**
 * Get a Simple Icon by name
 * @param skillName The name of the skill
 * @returns The SimpleIcon object or null if not found
 */
export function getSimpleIcon(skillName: string): { slug: string, path: string, hex: string } | null {
  if (!skillName) return null;
  
  // Normalize the skill name
  const normalizedName = skillName.toLowerCase().trim();
  
  // Try to find the skill in our mapping
  let iconSlug = ICON_MAP[normalizedName];
  
  // If not found directly, try to find a partial match
  if (!iconSlug) {
    for (const [key, value] of Object.entries(ICON_MAP)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        iconSlug = value;
        break;
      }
    }
  }
  
  // If we found a slug, try to get the icon
  if (iconSlug) {
    // Convert to SimpleIcons format (e.g. "siJavascript")
    const simpleIconKey = `si${iconSlug.charAt(0).toUpperCase()}${iconSlug.slice(1)}`;
    
    // Try to get the icon
    if ((SimpleIcons as any)[simpleIconKey]) {
      const icon = (SimpleIcons as any)[simpleIconKey];
      return {
        slug: iconSlug,
        path: icon.path,
        hex: icon.hex
      };
    }
  }
  
  // If all else fails, try a direct lookup
  try {
    // Normalize for SimpleIcons format (remove spaces, special chars)
    const simpleIconsFormat = normalizedName
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();
    
    // Try various possible key formats
    const possibleKeys = [
      `si${simpleIconsFormat.charAt(0).toUpperCase()}${simpleIconsFormat.slice(1)}`,
      `si${simpleIconsFormat}`,
      `si${simpleIconsFormat.toUpperCase()}`
    ];
    
    for (const key of possibleKeys) {
      if ((SimpleIcons as any)[key]) {
        const icon = (SimpleIcons as any)[key];
        return {
          slug: simpleIconsFormat,
          path: icon.path,
          hex: icon.hex
        };
      }
    }
  } catch (e) {
    console.error("Error looking up SimpleIcon:", e);
  }
  
  return null;
}

/**
 * Create an SVG data URL for a skill
 * @param skillName The name of the skill
 * @param size The size of the SVG (default: 24x24)
 * @returns A data URL containing the SVG or null if no icon was found
 */
export function getSkillIconDataUrl(skillName: string, size: number = 24): string | null {
  const icon = getSimpleIcon(skillName);
  
  if (!icon) return null;
  
  // Create SVG content
  const color = `#${icon.hex}`;
  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}">
      <path d="${icon.path}"/>
    </svg>
  `.trim();
  
  // Convert to data URL
  try {
    return `data:image/svg+xml;base64,${btoa(svgContent)}`;
  } catch (e) {
    console.error("Error creating SVG data URL:", e);
    return null;
  }
}

/**
 * Gets the best available icon for a skill
 * @param skill The skill object
 * @returns The URL to use for the skill icon
 */
export function getSkillIconUrl(skill: { name: string, image_url?: string }): string | null {
  // First try the image_url if available
  if (skill.image_url) {
    return skill.image_url;
  }
  
  // Then try to get a SimpleIcon
  return getSkillIconDataUrl(skill.name);
}

/**
 * A list of suggested skills to show to users
 */
export const SUGGESTED_SKILLS = [
  "JavaScript",
  "TypeScript", 
  "Python",
  "React",
  "Node.js",
  "HTML/CSS",
  "SQL",
  "Git",
  "Docker",
  "Java",
  "C++",
  "Figma",
  "Photoshop",
  "UI/UX Design",
  "AWS"
];