export interface UserProgress {
  level: number;
  currentXP: number;
  totalXP: number;
}

export interface LevelReward {
  level: number;
  title: string;
  description: string;
  icon: string;
}

// XP required for each level (exponential growth)
export const getXPForLevel = (level: number): number => {
  return Math.floor(100 * Math.pow(1.5, level - 1));
};

// Calculate total XP needed to reach a level
export const getTotalXPForLevel = (level: number): number => {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += getXPForLevel(i);
  }
  return total;
};

// Calculate level from total XP
export const getLevelFromXP = (totalXP: number): number => {
  let level = 1;
  let xpNeeded = 0;
  
  while (xpNeeded <= totalXP) {
    xpNeeded += getXPForLevel(level);
    if (xpNeeded <= totalXP) {
      level++;
    }
  }
  
  return level;
};

// Get current XP progress within current level
export const getCurrentLevelXP = (totalXP: number): number => {
  const level = getLevelFromXP(totalXP);
  const totalXPForCurrentLevel = getTotalXPForLevel(level);
  return totalXP - totalXPForCurrentLevel;
};

// Add XP and calculate new level
export const addXP = (currentProgress: UserProgress, xpToAdd: number): { 
  newProgress: UserProgress; 
  leveledUp: boolean; 
  newRewards: LevelReward[];
} => {
  const newTotalXP = currentProgress.totalXP + xpToAdd;
  const newLevel = getLevelFromXP(newTotalXP);
  const newCurrentXP = getCurrentLevelXP(newTotalXP);
  
  const leveledUp = newLevel > currentProgress.level;
  const newRewards = leveledUp ? getRewardsForLevelRange(currentProgress.level + 1, newLevel) : [];
  
  return {
    newProgress: {
      level: newLevel,
      currentXP: newCurrentXP,
      totalXP: newTotalXP
    },
    leveledUp,
    newRewards
  };
};

// Get rewards unlocked in a level range
export const getRewardsForLevelRange = (startLevel: number, endLevel: number): LevelReward[] => {
  const allRewards = getLevelRewards();
  return allRewards.filter(r => r.level > startLevel && r.level <= endLevel);
};

// Define rewards for each level milestone
export const getLevelRewards = (): LevelReward[] => {
  return [
    { level: 2, title: "First Steps", description: "You've completed your first questions!", icon: "🎯" },
    { level: 3, title: "Getting Started", description: "You're building momentum!", icon: "🚀" },
    { level: 5, title: "Engaged Member", description: "You're actively contributing!", icon: "⭐" },
    { level: 7, title: "Dedicated Contributor", description: "Your voice matters!", icon: "💎" },
    { level: 10, title: "Team Champion", description: "You're a valued team member!", icon: "🏆" },
    { level: 15, title: "Feedback Master", description: "Your insights drive improvement!", icon: "🎓" },
    { level: 20, title: "Culture Leader", description: "You're shaping our culture!", icon: "👑" },
    { level: 25, title: "Innovation Pioneer", description: "Your ideas inspire us!", icon: "💡" },
    { level: 30, title: "Legendary Contributor", description: "You're a legend!", icon: "🌟" },
  ];
};

// Get all unlocked rewards for a given level
export const getUnlockedRewards = (level: number): LevelReward[] => {
  return getLevelRewards().filter(r => r.level <= level);
};

// Save progress to localStorage
export const saveProgress = (progress: UserProgress): void => {
  localStorage.setItem('userProgress', JSON.stringify(progress));
};

// Load progress from localStorage
export const loadProgress = (): UserProgress => {
  const saved = localStorage.getItem('userProgress');
  if (saved) {
    return JSON.parse(saved);
  }
  // Demo starting point: Level 5 with 850 XP
  return {
    level: 5,
    currentXP: 850,
    totalXP: getTotalXPForLevel(5) + 850
  };
};
