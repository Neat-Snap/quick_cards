
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skill, searchSkills } from "@/lib/api";
import { Search, X } from "lucide-react";
import { SUGGESTED_SKILLS } from "@/lib/SkillIconHelper";
import debounce from 'lodash/debounce';

interface SkillSelectorProps {
  selectedSkills: Skill[];
  onSelect: (skill: Skill) => void;
}

export function SkillSelector({ selectedSkills, onSelect }: SkillSelectorProps) {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Skill[]>([]);
  const [searching, setSearching] = useState(false);
  
  const filteredSuggestions = SUGGESTED_SKILLS.filter(suggestion => 
    !selectedSkills.some(skill => 
      skill.name.toLowerCase() === suggestion.toLowerCase()
    )
  );
  
  const debouncedSearch = debounce(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    
    try {
      const results = await searchSkills(searchQuery);
      
      const filteredResults = results.filter(skill => 
        !selectedSkills.some(s => s.id === skill.id)
      );
      
      setSearchResults(filteredResults);
    } catch (error) {
      console.error("Error searching skills:", error);
    } finally {
      setSearching(false);
    }
  }, 300);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (value.trim()) {
      setSearching(true);
      debouncedSearch(value);
    } else {
      setSearchResults([]);
    }
  };
  
  const handleSuggestionSelect = async (skillName: string) => {
    setSearching(true);
    
    try {
      const results = await searchSkills(skillName);
      
      const exactMatch = results.find(s => 
        s.name.toLowerCase() === skillName.toLowerCase()
      );
      
      if (exactMatch) {
        onSelect(exactMatch);
      } else if (results.length > 0) {
        onSelect(results[0]);
      }
    } catch (error) {
      console.error("Error selecting skill:", error);
    } finally {
      setSearching(false);
      setQuery("");
      setSearchResults([]);
    }
  };
  
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search for skills..."
          value={query}
          onChange={handleInputChange}
          className="pl-9"
        />
      </div>
      
      {!query && filteredSuggestions.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Suggested skills:</p>
          <div className="flex flex-wrap gap-1">
            {filteredSuggestions.slice(0, 8).map((skill, index) => (
              <Badge 
                key={`suggestion-${index}`}
                variant="outline"
                className="cursor-pointer hover:bg-primary/10"
                onClick={() => handleSuggestionSelect(skill)}
              >
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {query && (
        <div className="border rounded-md overflow-hidden max-h-60">
          {searching ? (
            <div className="p-3 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          ) : searchResults.length > 0 ? (
            <div className="max-h-60 overflow-y-auto">
              {searchResults.map(skill => (
                <div 
                  key={skill.id || skill.name}
                  className="p-2 hover:bg-muted/30 cursor-pointer border-b last:border-b-0"
                  onClick={() => onSelect(skill)}
                >
                  <p className="font-medium text-sm">{skill.name}</p>
                  {skill.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {skill.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 text-center text-sm text-muted-foreground">
              No skills found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}