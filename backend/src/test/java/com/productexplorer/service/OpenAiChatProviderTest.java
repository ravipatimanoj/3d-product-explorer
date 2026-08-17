package com.productexplorer.service;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.productexplorer.config.AiProperties;
import com.productexplorer.exception.AiServiceException;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class OpenAiChatProviderTest {

    private static final String SECRET_KEY = "sk-test-secret-key-do-not-log";

    private HttpServer server;
    private ListAppender<ILoggingEvent> logAppender;

    @AfterEach
    void stopServer() {
        if (logAppender != null) {
            Logger logger = (Logger) LoggerFactory.getLogger(OpenAiChatProvider.class);
            logger.detachAppender(logAppender);
            logAppender.stop();
        }
        if (server != null) {
            server.stop(0);
        }
    }

    @Test
    void complete_missingApiKey_throwsConfiguredMessage() {
        AiProperties properties = new AiProperties(
                "",
                "gpt-4o-mini",
                "https://api.openai.com/v1",
                20
        );
        OpenAiChatProvider provider = new OpenAiChatProvider(properties, new ObjectMapper());

        assertThatThrownBy(() -> provider.complete("system", "hello"))
                .isInstanceOf(AiServiceException.class)
                .hasMessage("AI service is not configured.")
                .extracting(ex -> ((AiServiceException) ex).getStatus())
                .isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
    }

    @Test
    void complete_providerHttpError_keepsGenericResponseAndDoesNotLogApiKey() throws Exception {
        String providerBody = """
                {"error":{"message":"Incorrect API key provided: sk-test-secret-key-do-not-log.","type":"invalid_request_error","code":"invalid_api_key"}}
                """;
        startServer(401, providerBody, 0);

        logAppender = attachLogAppender();
        OpenAiChatProvider provider = new OpenAiChatProvider(testProperties(1), new ObjectMapper());

        assertThatThrownBy(() -> provider.complete("system", "hello"))
                .isInstanceOf(AiServiceException.class)
                .hasMessage("AI provider unavailable.")
                .satisfies(ex -> {
                    AiServiceException aiEx = (AiServiceException) ex;
                    assertThat(aiEx.getStatus()).isEqualTo(HttpStatus.BAD_GATEWAY);
                    assertThat(aiEx.getMessage()).doesNotContain(SECRET_KEY);
                    assertThat(String.valueOf(aiEx)).doesNotContain(SECRET_KEY);
                });

        String logs = logAppender.list.stream()
                .map(ILoggingEvent::getFormattedMessage)
                .collect(Collectors.joining("\n"));

        assertThat(logs).contains("OpenAI request failed with HTTP 401");
        assertThat(logs).contains("invalid_api_key");
        assertThat(logs).contains("[REDACTED]");
        assertThat(logs).doesNotContain(SECRET_KEY);
        assertThat(logs).doesNotContain("Authorization");
        assertThat(logs).doesNotContain("Bearer " + SECRET_KEY);
    }

    @Test
    void complete_providerTimeout_logsExceptionClassesWithoutApiKey() throws Exception {
        startServer(200, "{\"choices\":[]}", 2500);

        logAppender = attachLogAppender();
        OpenAiChatProvider provider = new OpenAiChatProvider(testProperties(1), new ObjectMapper());

        assertThatThrownBy(() -> provider.complete("system", "hello"))
                .isInstanceOf(AiServiceException.class)
                .hasMessage("AI provider timed out.")
                .satisfies(ex -> {
                    AiServiceException aiEx = (AiServiceException) ex;
                    assertThat(aiEx.getStatus()).isEqualTo(HttpStatus.GATEWAY_TIMEOUT);
                    assertThat(aiEx.getMessage()).doesNotContain(SECRET_KEY);
                });

        String logs = logAppender.list.stream()
                .map(ILoggingEvent::getFormattedMessage)
                .collect(Collectors.joining("\n"));

        assertThat(logs).contains("OpenAI request timed out or was unreachable.");
        assertThat(logs).contains("exception=org.springframework.web.client.ResourceAccessException");
        assertThat(logs).contains("rootCause=");
        assertThat(logs).doesNotContain(SECRET_KEY);
        assertThat(logs).doesNotContain("Authorization");
    }

    @Test
    void sanitizeForLog_redactsApiKeyAndAuthorizationWithoutChangingCallerContract() {
        String raw = "Authorization: Bearer " + SECRET_KEY
                + " Incorrect API key provided: " + SECRET_KEY;
        String sanitized = OpenAiChatProvider.sanitizeForLog(raw, SECRET_KEY);

        assertThat(sanitized).doesNotContain(SECRET_KEY);
        assertThat(sanitized).contains("[REDACTED]");
        assertThat(sanitized).doesNotContain("Bearer " + SECRET_KEY);
    }

    private AiProperties testProperties(int timeoutSeconds) {
        return new AiProperties(
                SECRET_KEY,
                "gpt-4o-mini",
                "http://127.0.0.1:" + server.getAddress().getPort() + "/v1",
                timeoutSeconds
        );
    }

    private static ListAppender<ILoggingEvent> attachLogAppender() {
        Logger logger = (Logger) LoggerFactory.getLogger(OpenAiChatProvider.class);
        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);
        logger.setLevel(Level.WARN);
        return appender;
    }

    private void startServer(int status, String body, long delayMs) throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/v1/chat/completions", exchange -> {
            try {
                if (delayMs > 0) {
                    Thread.sleep(delayMs);
                }
            } catch (InterruptedException ex) {
                Thread.currentThread().interrupt();
            }
            byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            try {
                exchange.sendResponseHeaders(status, bytes.length);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(bytes);
                }
            } catch (IOException ignored) {
                exchange.close();
            }
        });
        server.setExecutor(Executors.newSingleThreadExecutor());
        server.start();
    }
}
