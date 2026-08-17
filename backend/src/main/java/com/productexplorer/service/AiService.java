package com.productexplorer.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.productexplorer.dto.AiActionResponse;
import com.productexplorer.dto.AiChatResponse;
import com.productexplorer.dto.ProductFeatureResponse;
import com.productexplorer.dto.ProductResponse;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AiService {

    static final String SMARTPHONE_PRODUCT_ID = "smartphone-001";
    static final String VIEWER_UNAVAILABLE_MESSAGE =
            "3D AI interactions are not currently available for this product. "
                    + "I can still answer questions from the product catalog.";

    private static final Set<String> ALLOWED_ACTIONS = Set.of(
            "NONE",
            "FOCUS_FEATURE",
            "EXPLODE_PRODUCT",
            "ASSEMBLE_PRODUCT",
            "TOGGLE_FLASH"
    );

    private static final Set<String> VIEWER_ACTIONS = Set.of(
            "FOCUS_FEATURE",
            "EXPLODE_PRODUCT",
            "ASSEMBLE_PRODUCT",
            "TOGGLE_FLASH"
    );

    private final ProductService productService;
    private final AiProvider aiProvider;
    private final ObjectMapper objectMapper;

    public AiService(
            ProductService productService,
            AiProvider aiProvider,
            ObjectMapper objectMapper
    ) {
        this.productService = productService;
        this.aiProvider = aiProvider;
        this.objectMapper = objectMapper;
    }

    public AiChatResponse chat(String productId, String message) {
        ProductResponse product = productService.getProductById(productId);
        String raw = aiProvider.complete(buildSystemPrompt(product), message.trim());
        return validate(product, parse(raw));
    }

    String buildSystemPrompt(ProductResponse product) {
        boolean viewerEnabled = SMARTPHONE_PRODUCT_ID.equals(product.id());
        String featureLines = product.features().stream()
                .map(this::formatFeature)
                .collect(Collectors.joining("\n"));

        return """
                You are a product assistant for a 3D Product Explorer.
                Answer only from the product catalog context below. Do not invent specifications, colors, or features.
                If the user asks for information that is not in the context, say you do not have that detail.

                Return a JSON object with this exact shape:
                {"message":"string","action":null}
                or
                {"message":"string","action":{"type":"FOCUS_FEATURE","featureId":"camera"}}
                or
                {"message":"string","action":{"type":"EXPLODE_PRODUCT"}}
                or
                {"message":"string","action":{"type":"EXPLODE_PRODUCT","featureId":"camera"}}
                or
                {"message":"string","action":{"type":"ASSEMBLE_PRODUCT"}}
                or
                {"message":"string","action":{"type":"TOGGLE_FLASH","enabled":true}}

                Allowed action types: NONE, FOCUS_FEATURE, EXPLODE_PRODUCT, ASSEMBLE_PRODUCT, TOGGLE_FLASH.
                Use action null or type NONE only for product-level questions that are not about a specific catalog feature.
                FOCUS_FEATURE requires a featureId from the catalog ids below.
                EXPLODE_PRODUCT may include featureId when the user wants a component shown in exploded view.
                TOGGLE_FLASH requires enabled true or false.
                Never return any other action type. Never return JavaScript or extra fields.

                Intent rules:
                - If the user asks about a specific catalog feature, answer from the catalog AND return FOCUS_FEATURE for that feature. This includes "what is", "tell me about", "what does X do", "what camera", "battery capacity", and "what processor".
                - Product-level questions that are not about one catalog feature ("what colors", price, overall product description) stay informational (action null).
                - Commands like "show me", "focus on", "zoom into", "where is" a component are FOCUS_FEATURE.
                - "explode" or "take it apart" without a component is EXPLODE_PRODUCT.
                - "show X in exploded view", "inside the phone", or internals of a component is EXPLODE_PRODUCT with that featureId.
                - "put it back together", "assemble" is ASSEMBLE_PRODUCT.
                - "turn on/off the flash" is TOGGLE_FLASH. Do not use TOGGLE_FLASH for "show me the flash".
                - "show me the flash" is FOCUS_FEATURE with featureId flash.

                Viewer actions are %s for this product.
                %s

                Product context:
                id: %s
                name: %s
                category: %s
                description: %s
                available colors: %s
                features:
                %s
                """.formatted(
                viewerEnabled ? "ALLOWED" : "NOT ALLOWED",
                viewerEnabled
                        ? "You may return viewer actions."
                        : "Do not return viewer actions. If the user asks to show, explode, assemble, or toggle flash, explain that 3D AI interactions are not currently available for this product and keep action null.",
                product.id(),
                product.name(),
                product.category(),
                product.description(),
                String.join(", ", product.availableColors()),
                featureLines
        );
    }

    private String formatFeature(ProductFeatureResponse feature) {
        String specs = feature.specifications().stream()
                .map(spec -> spec.name() + ": " + spec.value())
                .collect(Collectors.joining("; "));
        return "- id=" + feature.id()
                + ", name=" + feature.name()
                + ", category=" + feature.category()
                + ", description=" + feature.description()
                + (specs.isBlank() ? "" : ", specifications=[" + specs + "]");
    }

    private AiChatResponse parse(String raw) {
        try {
            JsonNode root = objectMapper.readTree(extractJson(raw));
            if (root == null || !root.isObject()) {
                return fallbackResponse();
            }
            String message = root.path("message").asText("").trim();
            if (message.isBlank()) {
                return fallbackResponse();
            }
            JsonNode actionNode = root.get("action");
            if (actionNode == null || actionNode.isNull() || actionNode.isMissingNode()) {
                return new AiChatResponse(message, null);
            }
            if (!actionNode.isObject()) {
                return new AiChatResponse(message, null);
            }
            String type = actionNode.path("type").asText("").trim();
            String featureId = textOrNull(actionNode.get("featureId"));
            Boolean enabled = booleanOrNull(actionNode.get("enabled"));
            return new AiChatResponse(
                    message,
                    new AiActionResponse(type, featureId, enabled)
            );
        } catch (Exception ex) {
            return fallbackResponse();
        }
    }

    AiChatResponse validate(ProductResponse product, AiChatResponse parsed) {
        if (parsed == null || parsed.message() == null || parsed.message().isBlank()) {
            return fallbackResponse();
        }

        AiActionResponse action = parsed.action();
        if (action == null || action.type() == null || action.type().isBlank()) {
            return new AiChatResponse(parsed.message(), null);
        }

        String type = action.type().trim().toUpperCase(Locale.ROOT);
        if (!ALLOWED_ACTIONS.contains(type) || "NONE".equals(type)) {
            return new AiChatResponse(parsed.message(), null);
        }

        if (VIEWER_ACTIONS.contains(type) && !SMARTPHONE_PRODUCT_ID.equals(product.id())) {
            return new AiChatResponse(VIEWER_UNAVAILABLE_MESSAGE, null);
        }

        return switch (type) {
            case "FOCUS_FEATURE" -> validateFocus(product, parsed.message(), action.featureId());
            case "TOGGLE_FLASH" -> validateFlash(parsed.message(), action.enabled());
            case "EXPLODE_PRODUCT" -> validateExplode(product, parsed.message(), action.featureId());
            case "ASSEMBLE_PRODUCT" -> new AiChatResponse(
                    parsed.message(),
                    AiActionResponse.of("ASSEMBLE_PRODUCT")
            );
            default -> new AiChatResponse(parsed.message(), null);
        };
    }

    private AiChatResponse validateFocus(ProductResponse product, String message, String featureId) {
        String resolved = resolveFeatureId(product.features(), featureId);
        if (resolved == null) {
            return new AiChatResponse(
                    "That component is not available on this product.",
                    null
            );
        }
        return new AiChatResponse(message, AiActionResponse.focus(resolved));
    }

    private AiChatResponse validateExplode(ProductResponse product, String message, String featureId) {
        if (featureId == null || featureId.isBlank()) {
            return new AiChatResponse(message, AiActionResponse.of("EXPLODE_PRODUCT"));
        }
        String resolved = resolveFeatureId(product.features(), featureId);
        if (resolved == null) {
            return new AiChatResponse(message, AiActionResponse.of("EXPLODE_PRODUCT"));
        }
        return new AiChatResponse(message, AiActionResponse.explode(resolved));
    }

    private AiChatResponse validateFlash(String message, Boolean enabled) {
        if (enabled == null) {
            return new AiChatResponse(message, null);
        }
        return new AiChatResponse(message, AiActionResponse.flash(enabled));
    }

    private String resolveFeatureId(List<ProductFeatureResponse> features, String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String needle = raw.trim().toLowerCase(Locale.ROOT);
        for (ProductFeatureResponse feature : features) {
            if (feature.id().equalsIgnoreCase(needle)
                    || feature.modelNodeName().equalsIgnoreCase(needle)
                    || feature.name().equalsIgnoreCase(needle)) {
                return feature.id();
            }
        }
        return null;
    }

    private String extractJson(String raw) {
        String trimmed = raw.trim();
        if (trimmed.startsWith("```")) {
            int start = trimmed.indexOf('{');
            int end = trimmed.lastIndexOf('}');
            if (start >= 0 && end > start) {
                return trimmed.substring(start, end + 1);
            }
        }
        return trimmed;
    }

    private String textOrNull(JsonNode node) {
        if (node == null || node.isNull() || node.asText().isBlank()) {
            return null;
        }
        return node.asText().trim();
    }

    private Boolean booleanOrNull(JsonNode node) {
        if (node == null || node.isNull() || node.isMissingNode()) {
            return null;
        }
        if (node.isBoolean()) {
            return node.booleanValue();
        }
        if (node.isTextual()) {
            if ("true".equalsIgnoreCase(node.asText())) {
                return true;
            }
            if ("false".equalsIgnoreCase(node.asText())) {
                return false;
            }
        }
        return null;
    }

    private AiChatResponse fallbackResponse() {
        return new AiChatResponse("I couldn't complete that request. Please try again.", null);
    }
}
