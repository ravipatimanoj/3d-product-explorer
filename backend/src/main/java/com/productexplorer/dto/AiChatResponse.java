package com.productexplorer.dto;

public record AiChatResponse(
        String message,
        AiActionResponse action
) {
}
