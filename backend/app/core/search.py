"""
Skills search and matching functionality.
This module provides functions for matching user queries to predefined skills.
"""

from typing import Dict, List, Set, Optional, Tuple
import re
from difflib import SequenceMatcher

# Dictionary structure:
# - Main key is the canonical ID of the skill (lowercase, no spaces)
# - Each skill has: name (display name), description, image, and categories
# - The aliases field contains alternative ways to refer to the skill

SKILLS: Dict[str, Dict] = {
    # Programming Languages
    "python": {
        "name": "Python",
        "description": "A high-level, interpreted programming language known for its readability and versatility.",
        "image": "python.png",
        "categories": ["programming", "development", "data science"],
        "aliases": ["py", "python3", "python language"]
    },
    "javascript": {
        "name": "JavaScript",
        "description": "A programming language that enables interactive web pages and is an essential part of web applications.",
        "image": "javascript.png",
        "categories": ["programming", "web development", "frontend"],
        "aliases": ["js", "ecmascript", "node.js", "nodejs"]
    },
    "typescript": {
        "name": "TypeScript",
        "description": "A strongly typed programming language that builds on JavaScript, adding static type definitions.",
        "image": "typescript.png",
        "categories": ["programming", "web development"],
        "aliases": ["ts", "typed javascript"]
    },
    "java": {
        "name": "Java",
        "description": "A class-based, object-oriented programming language designed for having fewer implementation dependencies.",
        "image": "java.png",
        "categories": ["programming", "development", "enterprise"],
        "aliases": ["jvm", "java programming"]
    },
    "csharp": {
        "name": "C#",
        "description": "A modern, object-oriented programming language developed by Microsoft.",
        "image": "csharp.png",
        "categories": ["programming", "development", "microsoft"],
        "aliases": ["c sharp", "c-sharp", ".net", "dotnet"]
    },
    "cpp": {
        "name": "C++",
        "description": "A general-purpose programming language with a bias toward systems programming.",
        "image": "cpp.png",
        "categories": ["programming", "development", "systems"],
        "aliases": ["c plus plus", "c++11", "c++14", "c++17", "c++20"]
    },
    "go": {
        "name": "Go",
        "description": "A statically typed, compiled language designed at Google for simplicity and efficiency.",
        "image": "go.png",
        "categories": ["programming", "development", "backend"],
        "aliases": ["golang", "go language"]
    },
    "ruby": {
        "name": "Ruby",
        "description": "A dynamic, open source programming language focused on simplicity and productivity.",
        "image": "ruby.png",
        "categories": ["programming", "web development"],
        "aliases": ["rb", "ruby lang"]
    },
    "php": {
        "name": "PHP",
        "description": "A popular general-purpose scripting language especially suited for web development.",
        "image": "php.png",
        "categories": ["programming", "web development", "backend"],
        "aliases": ["php language", "hypertext preprocessor"]
    },
    "swift": {
        "name": "Swift",
        "description": "A powerful and intuitive programming language for iOS, macOS, and beyond.",
        "image": "swift.png",
        "categories": ["programming", "ios development", "apple"],
        "aliases": ["swift lang", "apple swift"]
    },
    
    # Databases
    "postgresql": {
        "name": "PostgreSQL",
        "description": "A powerful, open-source object-relational database system.",
        "image": "postgresql.png",
        "categories": ["database", "backend"],
        "aliases": ["postgres", "pgsql", "postgresql database"]
    },
    "mysql": {
        "name": "MySQL",
        "description": "An open-source relational database management system.",
        "image": "mysql.png",
        "categories": ["database", "backend"],
        "aliases": ["my-sql", "mysql database"]
    },
    "mongodb": {
        "name": "MongoDB",
        "description": "A source-available cross-platform document-oriented database program.",
        "image": "mongodb.png",
        "categories": ["database", "nosql", "backend"],
        "aliases": ["mongo", "mongodb database", "nosql database"]
    },
    "redis": {
        "name": "Redis",
        "description": "An in-memory data structure store, used as a database, cache, and message broker.",
        "image": "redis.png",
        "categories": ["database", "cache", "backend"],
        "aliases": ["redis database", "redis cache"]
    },
    
    # Web Frameworks
    "react": {
        "name": "React",
        "description": "A JavaScript library for building user interfaces, maintained by Facebook.",
        "image": "react.png",
        "categories": ["frontend", "web development", "javascript"],
        "aliases": ["reactjs", "react.js", "react library"]
    },
    "angular": {
        "name": "Angular",
        "description": "A platform for building mobile and desktop web applications, developed by Google.",
        "image": "angular.png",
        "categories": ["frontend", "web development", "javascript"],
        "aliases": ["angularjs", "angular framework", "ng"]
    },
    "vue": {
        "name": "Vue.js",
        "description": "A progressive JavaScript framework for building user interfaces.",
        "image": "vue.png",
        "categories": ["frontend", "web development", "javascript"],
        "aliases": ["vuejs", "vue js", "vue framework"]
    },
    "django": {
        "name": "Django",
        "description": "A high-level Python web framework that encourages rapid development and clean, pragmatic design.",
        "image": "django.png",
        "categories": ["backend", "web development", "python"],
        "aliases": ["django framework", "django python"]
    },
    "flask": {
        "name": "Flask",
        "description": "A lightweight WSGI web application framework in Python.",
        "image": "flask.png",
        "categories": ["backend", "web development", "python"],
        "aliases": ["flask python", "flask framework"]
    },
    "laravel": {
        "name": "Laravel",
        "description": "A PHP web application framework with expressive, elegant syntax.",
        "image": "laravel.png",
        "categories": ["backend", "web development", "php"],
        "aliases": ["laravel framework", "laravel php"]
    },
    
    # Design & Creative Tools
    "photoshop": {
        "name": "Adobe Photoshop",
        "description": "A raster graphics editor for photo editing and digital art, developed by Adobe.",
        "image": "photoshop.png",
        "categories": ["design", "creative", "graphics"],
        "aliases": ["ps", "adobe ps", "photoshop cc"]
    },
    "illustrator": {
        "name": "Adobe Illustrator",
        "description": "A vector graphics editor for creating and editing vector images, developed by Adobe.",
        "image": "illustrator.png",
        "categories": ["design", "creative", "graphics"],
        "aliases": ["ai", "adobe ai", "illustrator cc"]
    },
    "figma": {
        "name": "Figma",
        "description": "A cloud-based design tool for interface and experience design, with real-time collaboration.",
        "image": "figma.png",
        "categories": ["design", "ui/ux", "collaboration"],
        "aliases": ["figma design", "figma tool"]
    },
    "sketch": {
        "name": "Sketch",
        "description": "A vector graphics editor for macOS, primarily used for user interface and experience design.",
        "image": "sketch.png",
        "categories": ["design", "ui/ux", "mac"],
        "aliases": ["sketch app", "sketch design"]
    },
    "indesign": {
        "name": "Adobe InDesign",
        "description": "A desktop publishing and typesetting software for creating print and digital publications.",
        "image": "indesign.png",
        "categories": ["design", "publishing", "print"],
        "aliases": ["id", "adobe id", "indesign cc"]
    },
    
    # 3D & CAD Tools
    "blender": {
        "name": "Blender",
        "description": "A free and open-source 3D computer graphics software for creating animated films, visual effects, 3D models, and more.",
        "image": "blender.png",
        "categories": ["3d", "animation", "modeling"],
        "aliases": ["blender 3d", "blender software"]
    },
    "autocad": {
        "name": "AutoCAD",
        "description": "A computer-aided design (CAD) software for precision drawing and documentation.",
        "image": "autocad.png",
        "categories": ["cad", "engineering", "design"],
        "aliases": ["auto cad", "autodesk autocad"]
    },
    "fusion360": {
        "name": "Fusion 360",
        "description": "A cloud-based 3D CAD, CAM, and CAE platform for product development.",
        "image": "fusion360.png",
        "categories": ["cad", "3d", "engineering"],
        "aliases": ["fusion 360", "autodesk fusion", "fusion"]
    },
    "solidworks": {
        "name": "SolidWorks",
        "description": "A solid modeling computer-aided design and engineering software.",
        "image": "solidworks.png",
        "categories": ["cad", "engineering", "3d"],
        "aliases": ["solid works", "dassault solidworks"]
    },
    "archicad": {
        "name": "ArchiCAD",
        "description": "An architectural BIM CAD software for 3D architectural design and modeling.",
        "image": "archicad.png",
        "categories": ["architecture", "cad", "design"],
        "aliases": ["archi cad", "graphisoft archicad"]
    },
    
    # Project Management & Collaboration
    "jira": {
        "name": "Jira",
        "description": "A project management tool developed by Atlassian for issue tracking and agile project management.",
        "image": "jira.png",
        "categories": ["project management", "collaboration", "agile"],
        "aliases": ["jira software", "atlassian jira"]
    },
    "trello": {
        "name": "Trello",
        "description": "A web-based Kanban-style list-making application for project management and task organization.",
        "image": "trello.png",
        "categories": ["project management", "collaboration", "kanban"],
        "aliases": ["trello board", "trello app"]
    },
    "asana": {
        "name": "Asana",
        "description": "A web and mobile application designed to help teams organize, track, and manage their work.",
        "image": "asana.png",
        "categories": ["project management", "collaboration", "task management"],
        "aliases": ["asana app", "asana project management"]
    },
    "slack": {
        "name": "Slack",
        "description": "A business communication platform offering many IRC-style features, including persistent chat rooms.",
        "image": "slack.png",
        "categories": ["communication", "collaboration", "messaging"],
        "aliases": ["slack app", "slack chat", "slack communication"]
    },
    
    # Cloud & DevOps
    "aws": {
        "name": "Amazon Web Services",
        "description": "A cloud computing platform provided by Amazon, offering various services like compute power, storage, and databases.",
        "image": "aws.png",
        "categories": ["cloud", "devops", "infrastructure"],
        "aliases": ["amazon aws", "amazon cloud", "aws cloud"]
    },
    "azure": {
        "name": "Microsoft Azure",
        "description": "A cloud computing service created by Microsoft for building, testing, deploying, and managing applications.",
        "image": "azure.png",
        "categories": ["cloud", "devops", "microsoft"],
        "aliases": ["ms azure", "azure cloud", "microsoft cloud"]
    },
    "docker": {
        "name": "Docker",
        "description": "A platform for developing, shipping, and running applications in containers.",
        "image": "docker.png",
        "categories": ["devops", "containers", "deployment"],
        "aliases": ["docker container", "docker platform"]
    },
    "kubernetes": {
        "name": "Kubernetes",
        "description": "An open-source container orchestration platform for automating deployment, scaling, and management of containerized applications.",
        "image": "kubernetes.png",
        "categories": ["devops", "containers", "orchestration"],
        "aliases": ["k8s", "kube", "kubernetes platform"]
    },
    
    # Soft Skills
    "communication": {
        "name": "Communication",
        "description": "The ability to convey information effectively and efficiently, both verbally and in writing.",
        "image": "communication.png",
        "categories": ["soft skill", "interpersonal"],
        "aliases": ["effective communication", "communication skills"]
    },
    "teamwork": {
        "name": "Teamwork",
        "description": "The ability to work collaboratively with others to achieve common goals.",
        "image": "teamwork.png",
        "categories": ["soft skill", "interpersonal"],
        "aliases": ["collaboration", "team player", "team collaboration"]
    },
    "leadership": {
        "name": "Leadership",
        "description": "The ability to guide, influence, and inspire others towards achieving goals.",
        "image": "leadership.png",
        "categories": ["soft skill", "management"],
        "aliases": ["team leadership", "leadership skills", "people management"]
    },
    "problemsolving": {
        "name": "Problem Solving",
        "description": "The ability to identify issues, analyze options, and implement effective solutions.",
        "image": "problemsolving.png",
        "categories": ["soft skill", "analytical"],
        "aliases": ["problem-solving", "critical thinking", "analytical skills"]
    },
    
    # Analytics & Data Science
    "excel": {
        "name": "Microsoft Excel",
        "description": "A spreadsheet program developed by Microsoft for calculations, data analysis, and visualization.",
        "image": "excel.png",
        "categories": ["analytics", "office", "data"],
        "aliases": ["ms excel", "excel spreadsheet", "microsoft spreadsheet"]
    },
    "tableau": {
        "name": "Tableau",
        "description": "An interactive data visualization software focused on business intelligence.",
        "image": "tableau.png",
        "categories": ["data visualization", "analytics", "bi"],
        "aliases": ["tableau software", "tableau visualization"]
    },
    "powerbi": {
        "name": "Power BI",
        "description": "A business analytics service by Microsoft that provides interactive visualizations and business intelligence capabilities.",
        "image": "powerbi.png",
        "categories": ["data visualization", "analytics", "microsoft"],
        "aliases": ["power bi", "microsoft power bi", "bi tool"]
    },
    "tensorflow": {
        "name": "TensorFlow",
        "description": "An open-source machine learning framework developed by Google for building and training ML models.",
        "image": "tensorflow.png",
        "categories": ["machine learning", "data science", "ai"],
        "aliases": ["tf", "tensorflow framework", "google tensorflow"]
    },
    "pytorch": {
        "name": "PyTorch",
        "description": "An open-source machine learning library developed by Facebook's AI Research lab.",
        "image": "pytorch.png",
        "categories": ["machine learning", "data science", "ai"],
        "aliases": ["torch", "pytorch framework", "facebook pytorch"]
    },
    
    # Marketing & SEO
    "seo": {
        "name": "SEO",
        "description": "Search Engine Optimization: techniques to improve a website's visibility in search engine results.",
        "image": "seo.png",
        "categories": ["marketing", "digital", "web"],
        "aliases": ["search engine optimization", "website seo", "google seo"]
    },
    "googleanalytics": {
        "name": "Google Analytics",
        "description": "A web analytics service offered by Google that tracks and reports website traffic.",
        "image": "googleanalytics.png",
        "categories": ["analytics", "marketing", "web"],
        "aliases": ["ga", "analytics", "google ga"]
    },
    
    # Mobile Development
    "androiddev": {
        "name": "Android Development",
        "description": "The process of creating applications for devices running the Android operating system.",
        "image": "androiddev.png",
        "categories": ["mobile", "development", "android"],
        "aliases": ["android programming", "android app development", "android studio"]
    },
    "iosdev": {
        "name": "iOS Development",
        "description": "The process of creating applications for Apple's iOS operating system.",
        "image": "iosdev.png",
        "categories": ["mobile", "development", "apple"],
        "aliases": ["ios programming", "iphone development", "ios app development"]
    },
    "flutterdev": {
        "name": "Flutter",
        "description": "Google's UI toolkit for building natively compiled applications for mobile, web, and desktop from a single codebase.",
        "image": "flutter.png",
        "categories": ["mobile", "development", "cross-platform"],
        "aliases": ["flutter framework", "flutter mobile", "flutter development"]
    },
    
    # Writing & Content
    "contentwriting": {
        "name": "Content Writing",
        "description": "The process of planning, writing and editing web content for digital marketing purposes.",
        "image": "contentwriting.png",
        "categories": ["writing", "marketing", "content"],
        "aliases": ["content creation", "web content", "article writing"]
    },
    "copywriting": {
        "name": "Copywriting",
        "description": "The art of writing text for the purpose of advertising or marketing a product, business, or idea.",
        "image": "copywriting.png",
        "categories": ["writing", "marketing", "advertising"],
        "aliases": ["ad copywriting", "marketing copy", "advertising text"]
    }
}

import json
import os
from typing import List, Dict, Any, Optional
from difflib import SequenceMatcher

# Path to the skills data file
SKILLS_DATA_PATH = os.path.join(os.path.dirname(__file__), 'data', 'skills.json')
SKILLS_ICONS_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'files', 'skills')

class SkillSearch:
    def __init__(self):
        self.skills_data = {}
        self.load_skills_data()
    
    def load_skills_data(self):
        """Load skills data from JSON file"""
        try:
            if os.path.exists(SKILLS_DATA_PATH):
                with open(SKILLS_DATA_PATH, 'r', encoding='utf-8') as f:
                    self.skills_data = json.load(f)
                print(f"Loaded {len(self.skills_data)} skills from data file")
            else:
                print(f"Skills data file not found at {SKILLS_DATA_PATH}, initializing empty")
                self.skills_data = {}
                # Create directory if it doesn't exist
                os.makedirs(os.path.dirname(SKILLS_DATA_PATH), exist_ok=True)
                # Create empty file
                self.save_skills_data()
        except Exception as e:
            print(f"Error loading skills data: {e}")
            self.skills_data = {}
    
    def save_skills_data(self):
        """Save skills data to JSON file"""
        try:
            with open(SKILLS_DATA_PATH, 'w', encoding='utf-8') as f:
                json.dump(self.skills_data, f, indent=2, ensure_ascii=False)
            print("Skills data saved successfully")
        except Exception as e:
            print(f"Error saving skills data: {e}")
    
    def add_skill(self, name: str, variations: List[str] = None, 
                  category: str = None, description: str = None, 
                  icon_name: str = None) -> bool:
        """Add a new skill to the dataset"""
        name_lower = name.lower()
        if name_lower in self.skills_data:
            return False  # Skill already exists
        
        # Generate variations if none provided
        if variations is None:
            variations = self._generate_variations(name)
        
        # Add the skill
        self.skills_data[name_lower] = {
            'name': name,
            'variations': variations,
            'category': category,
            'description': description,
            'icon_name': icon_name,
            'is_predefined': True  # Mark as predefined since we're adding it manually
        }
        
        # Save changes
        self.save_skills_data()
        return True
    
    def _generate_variations(self, name: str) -> List[str]:
        """Generate common variations of a skill name"""
        variations = [name.lower()]
        
        # Add without spaces
        if ' ' in name:
            variations.append(name.replace(' ', '').lower())
        
        # Add with dot in place of spaces
        if ' ' in name:
            variations.append(name.replace(' ', '.').lower())
        
        # Add without non-alphanumeric characters
        import re
        cleaned = re.sub(r'[^a-zA-Z0-9]', '', name)
        if cleaned.lower() not in variations:
            variations.append(cleaned.lower())
        
        # For technologies, add common prefixes/suffixes
        if name.lower() in ['javascript', 'js']:
            variations.extend(['js', 'javascript'])
        elif name.lower() in ['typescript', 'ts']:
            variations.extend(['ts', 'typescript'])
        elif name.lower() in ['python', 'py']:
            variations.extend(['py', 'python'])
        
        # For databases
        if name.lower() in ['postgresql', 'postgres']:
            variations.extend(['postgresql', 'postgres', 'psql'])
        
        # For design tools
        if name.lower() == 'adobe photoshop':
            variations.extend(['photoshop', 'ps'])
        elif name.lower() == 'adobe illustrator':
            variations.extend(['illustrator', 'ai'])
        
        return list(set(variations))  # Remove duplicates
    
    def search_skills(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Search for skills matching the query.
        Returns list of skills with name, description, and score
        """
        if not query or len(query) < 2:
            return []
        
        query_lower = query.lower()
        results = []
        
        # First check for exact matches in skill names and variations
        for skill_key, skill_data in self.skills_data.items():
            # Check main name
            if query_lower == skill_key:
                results.append({
                    'id': None,  # Will be filled by DB
                    'name': skill_data['name'],
                    'description': skill_data.get('description', ''),
                    'category': skill_data.get('category', ''),
                    'image_url': self._get_icon_url(skill_data.get('icon_name')),
                    'is_predefined': True,
                    'score': 1.0  # Perfect match
                })
                continue
            
            # Check variations
            if any(query_lower == var.lower() for var in skill_data.get('variations', [])):
                results.append({
                    'id': None,
                    'name': skill_data['name'],
                    'description': skill_data.get('description', ''),
                    'category': skill_data.get('category', ''),
                    'image_url': self._get_icon_url(skill_data.get('icon_name')),
                    'is_predefined': True,
                    'score': 0.9  # Very close match
                })
                continue
            
            # Check if query is contained in name or variations
            if query_lower in skill_key:
                # Calculate how significant the match is (e.g., "js" in "javascript" is significant)
                significance = len(query_lower) / len(skill_key)
                if significance > 0.5:
                    results.append({
                        'id': None,
                        'name': skill_data['name'],
                        'description': skill_data.get('description', ''),
                        'category': skill_data.get('category', ''),
                        'image_url': self._get_icon_url(skill_data.get('icon_name')),
                        'is_predefined': True,
                        'score': 0.8 * significance
                    })
                    continue
            
            # Check partial matches in variations
            for variation in skill_data.get('variations', []):
                if query_lower in variation.lower():
                    # Calculate significance
                    significance = len(query_lower) / len(variation)
                    if significance > 0.4:
                        results.append({
                            'id': None,
                            'name': skill_data['name'],
                            'description': skill_data.get('description', ''),
                            'category': skill_data.get('category', ''),
                            'image_url': self._get_icon_url(skill_data.get('icon_name')),
                            'is_predefined': True,
                            'score': 0.7 * significance
                        })
                        break
        
        # If we have few results, add fuzzy matches
        if len(results) < limit:
            for skill_key, skill_data in self.skills_data.items():
                # Skip skills already in results
                if any(r['name'].lower() == skill_data['name'].lower() for r in results):
                    continue
                
                # Use fuzzy matching
                main_ratio = self._fuzzy_match(query_lower, skill_key)
                variation_ratio = max(
                    [self._fuzzy_match(query_lower, var.lower()) for var in skill_data.get('variations', [''])]
                )
                
                best_ratio = max(main_ratio, variation_ratio)
                if best_ratio > 0.6:  # Threshold for fuzzy matches
                    results.append({
                        'id': None,
                        'name': skill_data['name'],
                        'description': skill_data.get('description', ''),
                        'category': skill_data.get('category', ''),
                        'image_url': self._get_icon_url(skill_data.get('icon_name')),
                        'is_predefined': True,
                        'score': best_ratio * 0.6  # Scale down fuzzy matches
                    })
        
        # Sort by score and limit results
        results.sort(key=lambda x: x['score'], reverse=True)
        return results[:limit]
    
    def _fuzzy_match(self, query: str, text: str) -> float:
        """Use sequence matcher for fuzzy matching"""
        return SequenceMatcher(None, query, text).ratio()
    
    def _get_icon_url(self, icon_name: Optional[str]) -> Optional[str]:
        """Get the URL for an icon"""
        if not icon_name:
            return None
        
        # First check if it's a local file
        local_path = os.path.join(SKILLS_ICONS_PATH, f"{icon_name}.png")
        if os.path.exists(local_path):
            return f"/files/skills/{icon_name}.png"
        
        # If no local icon, return null (frontend will use simple-icons if available)
        return None
    
    def get_predefined_skill(self, name: str) -> Optional[Dict[str, Any]]:
        """Get a predefined skill by name"""
        name_lower = name.lower()
        
        # Try direct match
        if name_lower in self.skills_data:
            skill_data = self.skills_data[name_lower]
            return {
                'id': None,
                'name': skill_data['name'],
                'description': skill_data.get('description', ''),
                'category': skill_data.get('category', ''),
                'image_url': self._get_icon_url(skill_data.get('icon_name')),
                'is_predefined': True
            }
        
        # Try variations
        for skill_key, skill_data in self.skills_data.items():
            variations = skill_data.get('variations', [])
            if any(name_lower == var.lower() for var in variations):
                return {
                    'id': None,
                    'name': skill_data['name'],
                    'description': skill_data.get('description', ''),
                    'category': skill_data.get('category', ''),
                    'image_url': self._get_icon_url(skill_data.get('icon_name')),
                    'is_predefined': True
                }
        
        return None


# Create a singleton instance
_skill_search = None

def get_skill_search() -> SkillSearch:
    """Get the skill search singleton"""
    global _skill_search
    if _skill_search is None:
        _skill_search = SkillSearch()
    return _skill_search


# Initial data population function - call this once to populate the database
def populate_initial_skills():
    """Populate initial skills data"""
    skill_search = get_skill_search()
    
    # Programming Languages
    skill_search.add_skill("JavaScript", description="High-level programming language essential for web development", category="Programming", icon_name="javascript")
    skill_search.add_skill("Python", description="Versatile programming language with simple, readable syntax", category="Programming", icon_name="python")
    skill_search.add_skill("Java", description="Object-oriented programming language for cross-platform applications", category="Programming", icon_name="java")
    skill_search.add_skill("C++", description="Powerful programming language with high performance", category="Programming", icon_name="cplusplus")
    skill_search.add_skill("C#", description="Microsoft programming language for .NET development", category="Programming", icon_name="csharp")
    skill_search.add_skill("PHP", description="Server-side scripting language for web development", category="Programming", icon_name="php")
    skill_search.add_skill("Swift", description="Apple's programming language for iOS, macOS, and more", category="Programming", icon_name="swift")
    skill_search.add_skill("Kotlin", description="Modern programming language for Android development", category="Programming", icon_name="kotlin")
    skill_search.add_skill("Ruby", description="Dynamic programming language focused on simplicity", category="Programming", icon_name="ruby")
    
    # Frameworks & Libraries
    skill_search.add_skill("React", description="JavaScript library for building user interfaces", category="Frontend", icon_name="react")
    skill_search.add_skill("Angular", description="Platform for building web applications", category="Frontend", icon_name="angular")
    skill_search.add_skill("Vue.js", description="Progressive JavaScript framework for UIs", category="Frontend", icon_name="vuedotjs")
    skill_search.add_skill("Django", description="Python web framework for rapid development", category="Backend", icon_name="django")
    skill_search.add_skill("Flask", description="Lightweight Python web framework", category="Backend", icon_name="flask")
    skill_search.add_skill("Express.js", description="Web application framework for Node.js", category="Backend", icon_name="express")
    skill_search.add_skill("Spring Boot", description="Java-based framework for microservices", category="Backend", icon_name="springboot")
    skill_search.add_skill("TensorFlow", description="End-to-end open source platform for machine learning", category="Data Science", icon_name="tensorflow")
    skill_search.add_skill("PyTorch", description="Open source machine learning framework", category="Data Science", icon_name="pytorch")
    
    # Databases
    skill_search.add_skill("PostgreSQL", description="Advanced open-source relational database", category="Database", icon_name="postgresql")
    skill_search.add_skill("MySQL", description="Popular open-source relational database system", category="Database", icon_name="mysql")
    skill_search.add_skill("MongoDB", description="NoSQL document database for modern applications", category="Database", icon_name="mongodb")
    skill_search.add_skill("Redis", description="In-memory data structure store", category="Database", icon_name="redis")
    skill_search.add_skill("SQLite", description="Self-contained, serverless SQL database engine", category="Database", icon_name="sqlite")
    
    # Design Tools
    skill_search.add_skill("Figma", description="Collaborative interface design tool", category="Design", icon_name="figma")
    skill_search.add_skill("Adobe Photoshop", description="Raster graphics editor for image editing and creation", category="Design", icon_name="adobephotoshop")
    skill_search.add_skill("Adobe Illustrator", description="Vector graphics editor for logos and illustrations", category="Design", icon_name="adobeillustrator")
    skill_search.add_skill("Sketch", description="Digital design app for macOS", category="Design", icon_name="sketch")
    skill_search.add_skill("InVision", description="Digital product design platform", category="Design", icon_name="invision")
    skill_search.add_skill("Adobe XD", description="Vector-based user experience design tool", category="Design", icon_name="adobexd")
    
    # 3D and CAD Software
    skill_search.add_skill("Blender", description="Free and open-source 3D creation suite", category="3D Design", icon_name="blender")
    skill_search.add_skill("AutoCAD", description="Computer-aided design software", category="CAD", icon_name="autodesk")
    skill_search.add_skill("Fusion 360", description="3D CAD, CAM, and CAE tool", category="CAD", icon_name="autodesk")
    skill_search.add_skill("ArchiCAD", description="Architectural BIM CAD software", category="CAD", icon_name="graphisoft")
    skill_search.add_skill("SketchUp", description="3D modeling computer program", category="3D Design", icon_name="sketchup")
    skill_search.add_skill("Rhino 3D", description="3D computer graphics and CAD software", category="CAD", icon_name="rhino")
    skill_search.add_skill("Revit", description="BIM software for architecture and engineering", category="CAD", icon_name="autodesk")
    
    # Dev Tools
    skill_search.add_skill("Git", description="Distributed version control system", category="Development Tools", icon_name="git")
    skill_search.add_skill("Docker", description="Platform for developing, shipping, and running applications", category="DevOps", icon_name="docker")
    skill_search.add_skill("Kubernetes", description="Open-source system for automating deployment and management", category="DevOps", icon_name="kubernetes")
    skill_search.add_skill("Jira", description="Issue tracking product for agile teams", category="Project Management", icon_name="jira")
    skill_search.add_skill("GitHub", description="Web-based hosting service for version control using Git", category="Development Tools", icon_name="github")
    skill_search.add_skill("AWS", description="Cloud computing platform by Amazon", category="Cloud", icon_name="amazonaws")
    skill_search.add_skill("Google Cloud", description="Cloud computing services by Google", category="Cloud", icon_name="googlecloud")
    skill_search.add_skill("Azure", description="Cloud computing service by Microsoft", category="Cloud", icon_name="microsoftazure")
    
    # General Skills
    skill_search.add_skill("Project Management", description="Planning, organizing, and overseeing projects", category="Management")
    skill_search.add_skill("UI Design", description="Design of user interfaces for machines and software", category="Design")
    skill_search.add_skill("UX Design", description="Enhancing user satisfaction by improving usability", category="Design")
    skill_search.add_skill("Content Writing", description="Creating content for digital and print media", category="Content")
    skill_search.add_skill("SEO", description="Search engine optimization techniques", category="Marketing", icon_name="googlesearchconsole")
    skill_search.add_skill("Data Analysis", description="Process of inspecting, cleaning, and modeling data", category="Data Science")
    skill_search.add_skill("Digital Marketing", description="Marketing of products or services using digital technologies", category="Marketing")
    skill_search.add_skill("Agile Methodology", description="Approach to project management and software development", category="Management")
    
    print(f"Populated {len(skill_search.skills_data)} initial skills")


if __name__ == "__main__":
    # Test the skill search
    populate_initial_skills()
    searcher = get_skill_search()
    
    test_queries = ["javascript", "python", "react", "figma", "js", "pg", "fusion", "archicad"]
    for query in test_queries:
        results = searcher.search_skills(query)
        print(f"\nSearch for '{query}':")
        for res in results:
            print(f"  - {res['name']} (score: {res['score']:.2f})")