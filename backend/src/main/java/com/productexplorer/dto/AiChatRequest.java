package com.productexplorer.dto;

import jakarta.validation.constraints.NotBlank;

public record AiChatRequest(
        @NotBlank String productId,
        @NotBlank String message
) {
}
