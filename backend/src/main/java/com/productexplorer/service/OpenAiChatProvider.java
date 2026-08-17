package com.productexplorer.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.productexplorer.config.AiProperties;
import com.productexplorer.exception.AiServiceException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
public class OpenAiChatProvider implements AiProvider {

    private static final Logger log = LoggerFactory.getLogger(OpenAiChatProvider.class);
    private static final int MAX_LOGGED_BODY_CHARS = 2000;

    private final AiProperties properties;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;

    public OpenAiChatProvider(AiProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(Duration.ofSeconds(Math.max(properties.timeoutSeconds(), 1)));
        this.restClient = RestClient.builder()
                .baseUrl(properties.baseUrl())
                .requestFactory(requestFactory)
                .build();
    }

    @Override
    public String complete(String systemPrompt, String userMessage) {
        if (!properties.isConfigured()) {
            throw new AiServiceException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "AI service is not configured."
            );
        }

        Map<String, Object> body = Map.of(
                "model", properties.model(),
                "temperature", 0.2,
                "response_format", Map.of("type", "json_object"),
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user", "content", userMessage)
                )
        );

        try {
            String response = restClient.post()
                    .uri("/chat/completions")
                    .header("Authorization", "Bearer " + properties.apiKey())
                    .header("Content-Type", "application/json")
                    .body(body)
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(response);
            JsonNode content = root.path("choices").path(0).path("message").path("content");
            if (content.isMissingNode() || content.isNull() || content.asText().isBlank()) {
                throw new AiServiceException(HttpStatus.BAD_GATEWAY, "AI response was invalid.");
            }
            return content.asText();
        } catch (AiServiceException ex) {
            throw ex;
        } catch (ResourceAccessException ex) {
            Throwable root = rootCause(ex);
            log.warn(
                    "OpenAI request timed out or was unreachable. exception={} rootCause={} rootMessage={}",
                    ex.getClass().getName(),
                    root.getClass().getName(),
                    sanitizeForLog(root.getMessage(), properties.apiKey())
            );
            throw new AiServiceException(HttpStatus.GATEWAY_TIMEOUT, "AI provider timed out.");
        } catch (RestClientResponseException ex) {
            log.warn(
                    "OpenAI request failed with HTTP {} body={}",
                    ex.getStatusCode().value(),
                    sanitizeForLog(ex.getResponseBodyAsString(), properties.apiKey())
            );
            throw new AiServiceException(HttpStatus.BAD_GATEWAY, "AI provider unavailable.");
        } catch (Exception ex) {
            Throwable root = rootCause(ex);
            log.warn(
                    "OpenAI request failed with unexpected error. exception={} rootCause={} rootMessage={}",
                    ex.getClass().getName(),
                    root.getClass().getName(),
                    sanitizeForLog(root.getMessage(), properties.apiKey())
            );
            throw new AiServiceException(HttpStatus.BAD_GATEWAY, "AI provider unavailable.");
        }
    }

    static String sanitizeForLog(String text, String secret) {
        if (text == null || text.isBlank()) {
            return "";
        }
        String sanitized = text;
        if (secret != null && !secret.isBlank()) {
            sanitized = sanitized.replace(secret, "[REDACTED]");
        }
        sanitized = sanitized.replaceAll("(?i)(Authorization\\s*[:=]\\s*)\\S+", "$1[REDACTED]");
        sanitized = sanitized.replaceAll("(?i)Bearer\\s+\\S+", "Bearer [REDACTED]");
        sanitized = sanitized.replaceAll("sk-[A-Za-z0-9_-]+", "sk-[REDACTED]");
        if (sanitized.length() > MAX_LOGGED_BODY_CHARS) {
            return sanitized.substring(0, MAX_LOGGED_BODY_CHARS) + "...[truncated]";
        }
        return sanitized;
    }

    private static Throwable rootCause(Throwable ex) {
        Throwable current = ex;
        while (current.getCause() != null && current.getCause() != current) {
            current = current.getCause();
        }
        return current;
    }
}
