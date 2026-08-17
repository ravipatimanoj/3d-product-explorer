package com.productexplorer.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "ai.openai")
public record AiProperties(
        String apiKey,
        String model,
        String baseUrl,
        int timeoutSeconds
) {
    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }
}
