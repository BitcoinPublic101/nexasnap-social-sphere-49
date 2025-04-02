
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, SparklesIcon, Zap } from 'lucide-react';

interface AIContentAssistantProps {
  onSelectContent: (content: string) => void;
  type: 'title' | 'post' | 'comment';
  isPremium?: boolean;
}

const AIContentAssistant: React.FC<AIContentAssistantProps> = ({ 
  onSelectContent, 
  type,
  isPremium = false
}) => {
  const [prompt, setPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateContent = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Empty prompt',
        description: 'Please enter a prompt to generate content',
        variant: 'destructive',
      });
      return;
    }

    if (!isPremium) {
      toast({
        title: 'Premium Feature',
        description: 'AI content generation is available for premium members only',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-content', {
        body: { prompt, type },
      });

      if (error) throw error;

      if (data?.generatedText) {
        // Clean up and format the generated text
        const content = data.generatedText.trim();
        setGeneratedContent([content, ...generatedContent.slice(0, 2)]);
      }
    } catch (error: any) {
      console.error('Error generating content:', error);
      toast({
        title: 'Generation failed',
        description: error.message || 'Failed to generate content',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelect = (content: string) => {
    onSelectContent(content);
    toast({
      title: 'Content applied',
      description: 'The AI-generated content has been added',
    });
  };

  const getPlaceholder = () => {
    switch (type) {
      case 'title':
        return 'E.g., "A technology news headline about AI ethics"';
      case 'post':
        return 'E.g., "Write about the top 5 trends in mobile app development"';
      case 'comment':
        return 'E.g., "A thoughtful response to an article about climate change"';
      default:
        return 'Enter a prompt to generate content';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder={getPlaceholder()}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="flex-1"
          disabled={isGenerating}
        />
        <Button 
          onClick={generateContent} 
          disabled={isGenerating || !prompt.trim()}
          className="gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <SparklesIcon className="h-4 w-4" />
              Generate
            </>
          )}
        </Button>
      </div>

      {!isPremium && (
        <div className="bg-primary/10 p-3 rounded-md flex items-center gap-3">
          <Zap className="h-5 w-5 text-primary" />
          <div className="flex-1 text-sm">
            <p className="font-medium">Premium Feature</p>
            <p className="text-muted-foreground">
              AI content generation is available for premium members only.
            </p>
          </div>
          <Button size="sm" variant="default" onClick={() => window.location.href = '/premium'}>
            Upgrade
          </Button>
        </div>
      )}

      {generatedContent.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Generated Content</h3>
          {generatedContent.map((content, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="py-2 px-4 bg-muted/30">
                <CardTitle className="text-sm flex justify-between items-center">
                  <span>AI Generated #{index + 1}</span>
                  <Button size="sm" variant="ghost" onClick={() => handleSelect(content)}>
                    Use This
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="max-h-32 overflow-y-auto text-sm">
                  {content.split('\n').map((line, i) => (
                    <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AIContentAssistant;
