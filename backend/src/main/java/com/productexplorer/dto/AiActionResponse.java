package com.productexplorer.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record AiActionResponse(
        String type,
        String featureId,
        Boolean enabled
) {
    public static AiActionResponse of(String type) {
        return new AiActionResponse(type, null, null);
    }

    public static AiActionResponse explode(String featureId) {
        return new AiActionResponse("EXPLODE_PRODUCT", featureId, null);
    }

    public static AiActionResponse assemble(String featureId) {
        return new AiActionResponse("ASSEMBLE_PRODUCT", featureId, null);
    }

    public static AiActionResponse focus(String featureId) {
        return new AiActionResponse("FOCUS_FEATURE", featureId, null);
    }

    public static AiActionResponse flash(boolean enabled) {
        return new AiActionResponse("TOGGLE_FLASH", null, enabled);
    }
}
