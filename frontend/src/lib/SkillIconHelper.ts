import * as SimpleIcons from 'simple-icons';

/**
 * Utility functions for working with skill icons
 */

const ICON_MAP: Record<string, string> = {
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
  
  "mysql": "mysql",
  "postgresql": "postgresql",
  "postgres": "postgresql",
  "mongodb": "mongodb",
  "redis": "redis",
  "sqlite": "sqlite",
  "firebase": "firebase",
  "supabase": "supabase",
  
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
  
  "android": "android",
  "ios": "ios",
  "react native": "reactnative",
  "flutter": "flutter",
  "ionic": "ionic",
  "xamarin": "xamarin",
  
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
  
  "blender": "blender",
  "unity": "unity",
  "unreal engine": "unrealengine",
  "autocad": "autodesk",
  "fusion 360": "autodesk"
};

export function getSimpleIcon(skillName: string): { slug: string, path: string, hex: string } | null {
  if (!skillName) return null;
  
  const normalizedName = skillName.toLowerCase().trim();
  
  let iconSlug = ICON_MAP[normalizedName];
  
  if (!iconSlug) {
    for (const [key, value] of Object.entries(ICON_MAP)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        iconSlug = value;
        break;
      }
    }
  }
  
  if (iconSlug) {
    const simpleIconKey = `si${iconSlug.charAt(0).toUpperCase()}${iconSlug.slice(1)}`;
    
    if ((SimpleIcons as any)[simpleIconKey]) {
      const icon = (SimpleIcons as any)[simpleIconKey];
      return {
        slug: iconSlug,
        path: icon.path,
        hex: icon.hex
      };
    }
  }
  
  try {
    const simpleIconsFormat = normalizedName
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();
    
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


export function getSkillIconDataUrl(skillName: string, size: number = 24): string | null {
  const icon = getSimpleIcon(skillName);
  
  if (!icon) return null;
  
  const color = `#${icon.hex}`;
  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24">
      <!-- White circular background -->
      <circle cx="12" cy="12" r="12" fill="white" />
      <!-- Icon with padding (80% of size) -->
      <g transform="translate(2.4, 2.4) scale(0.8)">
        <path d="${icon.path}" fill="${color}"/>
      </g>
    </svg>
  `.trim();
  
  try {
    return `data:image/svg+xml;base64,${btoa(svgContent)}`;
  } catch (e) {
    console.error("Error creating SVG data URL:", e);
    return null;
  }
}


export function getSkillIconUrl(skill: { name: string, image_url?: string }): string | null {
  if (skill.image_url) {
    return skill.image_url;
  }
  
  return getSkillIconDataUrl(skill.name);
}


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