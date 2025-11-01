import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Loader2 } from "lucide-react";
import ReactWordcloud from "react-wordcloud";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Generate or retrieve a persistent anonymous user ID
const getAnonymousUserId = (): string => {
  let userId = localStorage.getItem('anonymous_user_id');
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem('anonymous_user_id', userId);
  }
  return userId;
};

interface Keypoint {
  id: string;
  text: string;
  value: number;
  likes: number;
  count?: number;
}

interface WordCloudResultsProps {
  questionId: string;
  question: string;
  onClose: () => void;
  onCancel: () => void;
}

export const WordCloudResults = ({ questionId, question, onClose, onCancel }: WordCloudResultsProps) => {
  const [keypoints, setKeypoints] = useState<Keypoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedKeypoints, setLikedKeypoints] = useState<Set<string>>(new Set());
  const anonymousUserId = getAnonymousUserId();

  useEffect(() => {
    loadKeypoints();
  }, [questionId]);

  const loadKeypoints = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('extract-keypoints', {
        body: { questionId, question }
      });

      if (error) {
        console.error('Error loading keypoints:', error);
        toast.error('Failed to load keypoints');
        return;
      }

      if (data?.keypoints) {
        setKeypoints(data.keypoints);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load keypoints');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (keypointId: string) => {
    const isLiked = likedKeypoints.has(keypointId);
    
    if (isLiked) {
      // Unlike
      const { error } = await supabase
        .from('keypoint_likes')
        .delete()
        .eq('keypoint_id', keypointId)
        .eq('user_id', anonymousUserId);

      if (error) {
        console.error('Error unliking:', error);
        toast.error('Failed to unlike');
        return;
      }

      setLikedKeypoints(prev => {
        const next = new Set(prev);
        next.delete(keypointId);
        return next;
      });

      setKeypoints(prev => prev.map(kp => 
        kp.id === keypointId 
          ? { ...kp, likes: kp.likes - 1, value: Math.max(20, kp.value - 10) }
          : kp
      ));

      toast.success('Unliked!');
    } else {
      // Like
      const { error } = await supabase
        .from('keypoint_likes')
        .insert({
          keypoint_id: keypointId,
          user_id: anonymousUserId
        });

      if (error) {
        console.error('Error liking:', error);
        toast.error('Failed to like');
        return;
      }

      setLikedKeypoints(prev => new Set(prev).add(keypointId));
      
      setKeypoints(prev => prev.map(kp => 
        kp.id === keypointId 
          ? { ...kp, likes: kp.likes + 1, value: kp.value + 10 }
          : kp
      ));

      toast.success('Liked!', {
        icon: <Heart className="h-4 w-4 text-destructive fill-destructive" />,
      });
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
        <Card className="max-w-2xl w-full p-8 shadow-2xl animate-scale-in">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg text-muted-foreground">Analyzing responses...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <Card 
        className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Community Response Themes</h2>
            <p className="text-muted-foreground mb-4">Key themes from all responses</p>
            <div className="bg-muted/30 rounded-lg p-4">
              <p className="text-sm font-medium text-muted-foreground mb-1">Question:</p>
              <p className="text-base">{question}</p>
            </div>
          </div>

          {keypoints.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Not enough responses yet to generate themes</p>
            </div>
          ) : (
            <>
              {/* Word Cloud */}
              <div className="h-[400px] bg-muted/20 rounded-lg flex items-center justify-center">
                <ReactWordcloud
                  words={keypoints.map(kp => ({ text: kp.text, value: kp.value }))}
                  options={{
                    rotations: 2,
                    rotationAngles: [0, 0],
                    fontSizes: [20, 80],
                    colors: ["hsl(var(--primary))", "hsl(var(--primary) / 0.8)", "hsl(var(--primary) / 0.6)"],
                    enableTooltip: true,
                    deterministic: true,
                    padding: 10,
                    fontFamily: "inherit",
                    scale: "sqrt",
                  }}
                />
              </div>

              {/* Keypoint List with Likes */}
              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Like the themes that resonate with you:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {keypoints
                    .sort((a, b) => b.likes - a.likes)
                    .map((keypoint) => (
                      <div
                        key={keypoint.id}
                        className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border-2 border-transparent hover:border-primary/20 transition-all"
                      >
                        <div className="flex-1 flex items-center gap-2">
                          <span className="font-medium">{keypoint.text}</span>
                          {keypoint.count && keypoint.count > 1 && (
                            <Badge variant="outline" className="text-xs">
                              {keypoint.count}x
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {keypoint.likes > 0 && (
                            <Badge variant="secondary">{keypoint.likes}</Badge>
                          )}
                          <Button
                            size="sm"
                            variant={likedKeypoints.has(keypoint.id) ? "default" : "outline"}
                            className="h-9 w-9 p-0"
                            onClick={() => handleLike(keypoint.id)}
                          >
                            <Heart 
                              className={`h-4 w-4 ${likedKeypoints.has(keypoint.id) ? 'fill-current' : ''}`} 
                            />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline"
              className="flex-1" 
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button className="flex-1" onClick={onClose}>
              Continue to Next Question
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
