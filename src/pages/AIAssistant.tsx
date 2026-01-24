import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, Mic, MicOff, Plus, MessageSquare, Trash2, Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AudioWaveform from "@/components/AudioWaveform";

type Message = {
  role: "user" | "assistant";
  content: string;
  isAudioIdentification?: boolean;
  savedToCollection?: boolean;
};

type Conversation = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch conversations
  const { data: conversations = [] } = useQuery({
    queryKey: ["chat-conversations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_conversations")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as Conversation[];
    },
  });

  // Fetch messages for current conversation
  const { data: conversationMessages } = useQuery({
    queryKey: ["chat-messages", currentConversationId],
    queryFn: async () => {
      if (!currentConversationId) return [];
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("conversation_id", currentConversationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data.map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
    },
    enabled: !!currentConversationId,
  });

  // Load messages when conversation changes
  useEffect(() => {
    if (conversationMessages) {
      setMessages(conversationMessages);
    }
  }, [conversationMessages]);

  // Create conversation mutation
  const createConversation = useMutation({
    mutationFn: async (title: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const { data, error } = await supabase
        .from("chat_conversations")
        .insert({ user_id: user.id, title })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
    },
  });

  // Save message mutation
  const saveMessage = useMutation({
    mutationFn: async ({ conversationId, role, content }: { conversationId: string; role: string; content: string }) => {
      const { error } = await supabase
        .from("chat_messages")
        .insert({ conversation_id: conversationId, role, content });
      if (error) throw error;
      
      // Update conversation's updated_at
      await supabase
        .from("chat_conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conversationId);
    },
  });

  // Delete conversation mutation
  const deleteConversation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("chat_conversations")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-conversations"] });
      if (currentConversationId) {
        setCurrentConversationId(null);
        setMessages([]);
      }
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const streamChat = async (userMessages: Message[], audioBase64?: string) => {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: userMessages, audioBase64 }),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed with status ${resp.status}`);
    }

    if (!resp.body) throw new Error("No response body");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantContent = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) =>
                  i === prev.length - 1 ? { ...m, content: assistantContent } : m
                );
              }
              return [...prev, { role: "assistant", content: assistantContent }];
            });
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    return assistantContent;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      // Create conversation if needed
      let convId = currentConversationId;
      if (!convId) {
        const conv = await createConversation.mutateAsync(input.slice(0, 50));
        convId = conv.id;
        setCurrentConversationId(convId);
      }

      // Save user message
      await saveMessage.mutateAsync({ conversationId: convId, role: "user", content: userMessage.content });

      const assistantContent = await streamChat(newMessages);
      
      // Save assistant message
      if (assistantContent) {
        await saveMessage.mutateAsync({ conversationId: convId, role: "assistant", content: assistantContent });
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio context and analyser for waveform
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      analyser.fftSize = 256;
      source.connect(analyser);
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      setAnalyserNode(analyser);

      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((track) => track.stop());
        
        // Clean up audio context
        if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
        }
        analyserRef.current = null;
        setAnalyserNode(null);
        
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      toast({
        title: "Recording started",
        description: "Tap the microphone again to stop and identify the sound.",
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to use audio identification.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Parse species info from AI response for saving to collection
  const parseSpeciesFromResponse = (content: string): { speciesName: string; scientificName?: string; kingdom: string; description?: string } | null => {
    // Look for patterns like "Species: X" or "I identified this as X"
    const speciesPatterns = [
      /(?:species|identified|recognize|detected|hearing|sounds like)[:\s]+(?:a\s+)?([A-Z][a-z]+(?:\s+[a-z]+)?)/i,
      /(?:This (?:is|sounds like)(?: a| an)?)\s+([A-Z][a-z]+(?:\s+[a-z]+)?)/i,
      /\*\*([A-Z][a-z]+(?:\s+[a-z]+)?)\*\*/,
    ];

    for (const pattern of speciesPatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        const speciesName = match[1].trim();
        
        // Try to find scientific name
        const scientificMatch = content.match(/\(([A-Z][a-z]+\s+[a-z]+)\)/);
        
        // Determine kingdom based on common patterns
        let kingdom = "other";
        const lowerContent = content.toLowerCase();
        if (lowerContent.includes("bird") || lowerContent.includes("avian") || lowerContent.includes("song")) kingdom = "bird";
        else if (lowerContent.includes("mammal") || lowerContent.includes("canine") || lowerContent.includes("feline")) kingdom = "mammal";
        else if (lowerContent.includes("insect") || lowerContent.includes("cricket") || lowerContent.includes("cicada")) kingdom = "insect";
        else if (lowerContent.includes("frog") || lowerContent.includes("toad") || lowerContent.includes("amphibian")) kingdom = "amphibian";
        else if (lowerContent.includes("reptile") || lowerContent.includes("lizard") || lowerContent.includes("snake")) kingdom = "reptile";

        return {
          speciesName,
          scientificName: scientificMatch?.[1],
          kingdom,
          description: content.slice(0, 500),
        };
      }
    }
    return null;
  };

  // Save species to collection
  const saveToCollection = useCallback(async (messageIndex: number) => {
    const message = messages[messageIndex];
    if (!message || message.role !== "assistant") return;

    const speciesInfo = parseSpeciesFromResponse(message.content);
    if (!speciesInfo) {
      toast({
        title: "Cannot save",
        description: "Could not identify species information from this response.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Not logged in",
          description: "Please log in to save species to your collection.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("species_identifications").insert({
        user_id: user.id,
        species_name: speciesInfo.speciesName,
        scientific_name: speciesInfo.scientificName || null,
        kingdom: speciesInfo.kingdom,
        description: speciesInfo.description,
        confidence: 70, // Default confidence for audio identification
      });

      if (error) throw error;

      // Mark message as saved
      setMessages(prev => prev.map((m, i) => 
        i === messageIndex ? { ...m, savedToCollection: true } : m
      ));

      toast({
        title: "Saved to collection!",
        description: `${speciesInfo.speciesName} has been added to your species collection.`,
      });
    } catch (error) {
      console.error("Error saving to collection:", error);
      toast({
        title: "Error",
        description: "Failed to save species to collection.",
        variant: "destructive",
      });
    }
  }, [messages, toast]);

  const processAudio = async (audioBlob: Blob) => {
    setIsLoading(true);
    
    const userMessage: Message = { role: "user", content: "🎤 [Audio recording for species identification]" };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    try {
      // Convert to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      // Create conversation if needed
      let convId = currentConversationId;
      if (!convId) {
        const conv = await createConversation.mutateAsync("Audio species identification");
        convId = conv.id;
        setCurrentConversationId(convId);
      }

      // Save user message
      await saveMessage.mutateAsync({ conversationId: convId, role: "user", content: userMessage.content });

      const assistantContent = await streamChat(messages, base64);
      
      // Save assistant message and mark as audio identification
      if (assistantContent) {
        await saveMessage.mutateAsync({ conversationId: convId, role: "assistant", content: assistantContent });
        // Mark the last message as an audio identification result
        setMessages(prev => prev.map((m, i) => 
          i === prev.length - 1 && m.role === "assistant" 
            ? { ...m, isAudioIdentification: true } 
            : m
        ));
      }
    } catch (error) {
      console.error("Audio processing error:", error);
      toast({
        title: "Error",
        description: "Failed to process audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setShowHistory(false);
  };

  const loadConversation = (conv: Conversation) => {
    setCurrentConversationId(conv.id);
    setShowHistory(false);
  };

  const suggestedQuestions = [
    "How do I identify a bird by its call?",
    "What plants are safe for pets?",
    "Tips for photographing wildlife",
    "How does species identification work?",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <div className="p-4 border-b bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold">AI Assistant</h1>
              <p className="text-sm text-muted-foreground">Ask me anything about species!</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              History
            </Button>
            <Button variant="outline" size="sm" onClick={startNewChat}>
              <Plus className="h-4 w-4 mr-1" />
              New
            </Button>
          </div>
        </div>
      </div>

      {showHistory ? (
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-2">
            {conversations.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No conversations yet</p>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 ${
                    currentConversationId === conv.id ? "bg-muted" : ""
                  }`}
                  onClick={() => loadConversation(conv)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{conv.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(conv.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation.mutate(conv.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      ) : (
        <>
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-lg font-semibold mb-2">Welcome to AI Assistant!</h2>
                <p className="text-muted-foreground mb-4 max-w-sm">
                  I can help you learn about wildlife, plants, and identify species by sound.
                </p>
                <div className="flex items-center gap-2 mb-6 p-3 rounded-lg bg-muted">
                  <Mic className="h-5 w-5 text-primary" />
                  <span className="text-sm">Tap the microphone to identify species by sound!</span>
                </div>
                <div className="grid gap-2 w-full max-w-sm">
                  {suggestedQuestions.map((question) => (
                    <Button
                      key={question}
                      variant="outline"
                      className="text-left justify-start h-auto py-3 px-4"
                      onClick={() => setInput(question)}
                    >
                      {question}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4 pb-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {message.role === "assistant" && (
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div className="flex flex-col gap-2 max-w-[80%]">
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                      </div>
                      {message.role === "assistant" && message.isAudioIdentification && (
                        <Button
                          variant={message.savedToCollection ? "secondary" : "outline"}
                          size="sm"
                          className="self-start gap-2"
                          onClick={() => saveToCollection(index)}
                          disabled={message.savedToCollection}
                        >
                          {message.savedToCollection ? (
                            <>
                              <Check className="h-3 w-3" />
                              Saved
                            </>
                          ) : (
                            <>
                              <Save className="h-3 w-3" />
                              Save to Collection
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                    {message.role === "user" && (
                      <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex gap-3 justify-start">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="rounded-2xl px-4 py-2 bg-muted">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {isRecording && (
            <div className="p-4 border-t">
              <AudioWaveform isRecording={isRecording} analyserNode={analyserNode} />
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-4 border-t bg-background">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={isRecording ? "destructive" : "outline"}
                size="icon"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isLoading}
                className={isRecording ? "animate-pulse" : ""}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about species, wildlife, or record audio..."
                disabled={isLoading || isRecording}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !input.trim() || isRecording} size="icon">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            {isRecording && (
              <p className="text-xs text-center text-destructive mt-2 animate-pulse">
                🔴 Recording... Tap microphone to stop
              </p>
            )}
          </form>
        </>
      )}
    </div>
  );
}
