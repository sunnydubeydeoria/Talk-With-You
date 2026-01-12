import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, AlertCircle } from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils";

const messageSchema = z
  .string()
  .trim()
  .min(1, "Message cannot be empty")
  .max(1000, "Message must be less than 1000 characters")
  .refine(
    (val) => !/<script[\s\S]*?>[\s\S]*?<\/script>/gi.test(val),
    "Invalid characters detected"
  )
  .refine(
    (val) => !/javascript:|data:|vbscript:/gi.test(val),
    "Invalid content detected"
  );

interface MessageInputProps {
  onSend: (content: string) => void;
  onTyping: () => void;
  maxRetries?: number;
  rateLimitMs?: number;
}

const MessageInput = ({
  onSend,
  onTyping,
  maxRetries = 3,
  rateLimitMs = 1000,
}: MessageInputProps) => {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [rateLimitRemaining, setRateLimitRemaining] = useState(0);

  const rateLimitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSubmitTimeRef = useRef<number>(0);
  const retryCountRef = useRef<number>(0);

  // Enhanced validation with detailed error messages
  const getValidationError = useCallback((value: string): string | null => {
    const result = messageSchema.safeParse(value);
    if (!result.success) {
      const firstError = result.error.issues[0];
      return firstError?.message || "Invalid message";
    }
    return null;
  }, []);

  // Rate limiting check
  const checkRateLimit = useCallback((): boolean => {
    const now = Date.now();
    const timeSinceLastSubmit = now - lastSubmitTimeRef.current;

    if (timeSinceLastSubmit < rateLimitMs) {
      const remaining = Math.ceil((rateLimitMs - timeSinceLastSubmit) / 1000);
      setRateLimitRemaining(remaining);

      // Clear existing timeout
      if (rateLimitTimeoutRef.current) {
        clearTimeout(rateLimitTimeoutRef.current);
      }

      // Set new timeout to reset rate limit
      rateLimitTimeoutRef.current = setTimeout(() => {
        setRateLimitRemaining(0);
        rateLimitTimeoutRef.current = null;
      }, rateLimitMs - timeSinceLastSubmit);

      return false;
    }

    setRateLimitRemaining(0);
    return true;
  }, [rateLimitMs]);

  // Enhanced input sanitization
  const sanitizeInput = useCallback((input: string): string => {
    return input
      .trim()
      .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\uFEFF]/g, '') // Remove control characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .slice(0, 1000); // Enforce max length
  }, []);

  // Enhanced submit handler with rate limiting and error handling
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Prevent multiple submissions
      if (isSubmitting) return;

      // Validate input
      const validationError = getValidationError(message);
      if (validationError) {
        setSubmitError(validationError);
        return;
      }

      // Check rate limit
      if (!checkRateLimit()) {
        setSubmitError(`Please wait ${rateLimitRemaining} second${rateLimitRemaining > 1 ? 's' : ''} before sending another message.`);
        return;
      }

      setIsSubmitting(true);
      setSubmitError(null);

      try {
        const sanitizedMessage = sanitizeInput(message);
        lastSubmitTimeRef.current = Date.now();
        retryCountRef.current = 0;

        await onSend(sanitizedMessage);
        setMessage("");
      } catch (error) {
        console.error('Failed to send message:', error);

        // Retry logic
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          setSubmitError(`Send failed. Retrying... (${retryCountRef.current}/${maxRetries})`);

          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 5000);
          setTimeout(() => {
            setIsSubmitting(false);
            // Retry automatically
            handleSubmit(e as any);
          }, delay);
          return;
        }

        setSubmitError(error instanceof Error ? error.message : 'Failed to send message');
        retryCountRef.current = 0;
      } finally {
        if (retryCountRef.current === 0) {
          setIsSubmitting(false);
        }
      }
    },
    [
      message,
      isSubmitting,
      getValidationError,
      checkRateLimit,
      rateLimitRemaining,
      sanitizeInput,
      onSend,
      maxRetries,
    ]
  );

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    } else if (e.key === "Escape") {
      setMessage("");
      setSubmitError(null);
    }
  }, [handleSubmit]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setMessage(newValue.slice(0, 1000)); // Enforce max length
    setSubmitError(null);

    // Trigger typing indicator with debounce
    if (newValue.trim()) {
      onTyping();
    }
  }, [onTyping]);

  // Cleanup timeouts on unmount
  const cleanup = useCallback(() => {
    if (rateLimitTimeoutRef.current) {
      clearTimeout(rateLimitTimeoutRef.current);
      rateLimitTimeoutRef.current = null;
    }
  }, []);

  // Add cleanup effect
  React.useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const validationError = getValidationError(message);
  const isDisabled = isSubmitting || !!rateLimitRemaining || !!validationError;
  const characterCount = message.length;
  const isNearLimit = characterCount > 900;

  return (
    <div className="p-4 border-t border-border bg-background/50 backdrop-blur-sm">
      <form onSubmit={handleSubmit} className="space-y-2">
        {/* Error message display */}
        {(submitError || validationError) && (
          <div
            className={cn(
              "flex items-center gap-2 text-sm px-3 py-2 rounded-lg border",
              submitError
                ? "bg-destructive/10 text-destructive border-destructive/20"
                : "bg-muted/50 text-foreground border-border"
            )}
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm">{submitError || validationError}</span>
          </div>
        )}

        {/* Rate limit indicator */}
        {rateLimitRemaining > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground px-3 py-1">
            <span>Rate limited. Please wait {rateLimitRemaining} second{rateLimitRemaining > 1 ? 's' : ''}.</span>
          </div>
        )}

        {/* Main input area */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Textarea
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... (Enter to send, Shift+Enter for new line, Escape to clear)"
              className={cn(
                "min-h-[60px] max-h-[120px] resize-none pr-12 bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary/50",
                validationError && "border-destructive/50 focus:border-destructive/50",
                isNearLimit && "border-yellow-500/50"
              )}
              maxLength={1000}
              disabled={isSubmitting}
              aria-label="Message input"
              aria-describedby={validationError ? "message-error" : undefined}
              aria-invalid={!!validationError}
            />

            {/* Character count indicator */}
            <div
              className={cn(
                "absolute bottom-2 right-2 text-xs",
                isNearLimit
                  ? "text-yellow-500 font-medium"
                  : characterCount > 0
                  ? "text-muted-foreground"
                  : "text-muted-foreground/50"
              )}
              aria-label={`${characterCount} of 1000 characters`}
            >
              {characterCount}/1000
            </div>
          </div>

          <Button
            type="submit"
            size="icon"
            className={cn(
              "h-[60px] w-[60px] shrink-0 transition-all duration-200",
              isDisabled
                ? "bg-muted hover:bg-muted cursor-not-allowed opacity-50"
                : "bg-primary hover:bg-primary/90 active:scale-95",
              isSubmitting && "animate-pulse"
            )}
            disabled={isDisabled}
            aria-label={isSubmitting ? "Sending message..." : "Send message"}
            title={validationError || (rateLimitRemaining > 0 ? `Rate limited (${rateLimitRemaining}s)` : "Send message (Enter)")}
          >
            {isSubmitting ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Help text */}
        <div className="text-xs text-muted-foreground px-1">
          <span>
            Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> to send,
            <kbd className="px-1 py-0.5 bg-muted rounded text-xs ml-1">Shift+Enter</kbd> for new line,
            <kbd className="px-1 py-0.5 bg-muted rounded text-xs ml-1">Esc</kbd> to clear
          </span>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;
