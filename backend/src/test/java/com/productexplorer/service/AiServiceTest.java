package com.productexplorer.service;

import com.productexplorer.dto.AiChatResponse;
import com.productexplorer.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Import(AiServiceTest.FakeAiConfig.class)
class AiServiceTest {

    @TestConfiguration
    static class FakeAiConfig {
        @Bean
        @Primary
        RecordingAiProvider recordingAiProvider() {
            return new RecordingAiProvider();
        }
    }

    @Autowired
    private AiService aiService;

    @Autowired
    private RecordingAiProvider aiProvider;

    @BeforeEach
    void resetProvider() {
        aiProvider.setNextResponse("{\"message\":\"ok\",\"action\":null}");
    }

    @Test
    void featureQuestion_keepsFocusAction() {
        aiProvider.setNextResponse("""
                {
                  "message": "The Camera System includes the main sensor, ultra-wide camera, and optical zoom.",
                  "action": { "type": "FOCUS_FEATURE", "featureId": "camera" }
                }
                """);

        AiChatResponse response = aiService.chat("smartphone-001", "Tell me about the camera");

        assertThat(response.message()).contains("Camera System");
        assertThat(response.action()).isNotNull();
        assertThat(response.action().type()).isEqualTo("FOCUS_FEATURE");
        assertThat(response.action().featureId()).isEqualTo("camera");
    }

    @Test
    void productLevelQuestion_keepsNullAction() {
        aiProvider.setNextResponse("""
                {
                  "message": "Available colors are Natural, Black, Silver, and Blue.",
                  "action": null
                }
                """);

        AiChatResponse response = aiService.chat("smartphone-001", "What colors are available?");

        assertThat(response.action()).isNull();
    }

    @Test
    void focusFeature_returnsCameraAction() {
        aiProvider.setNextResponse("""
                {
                  "message": "Showing the Camera System.",
                  "action": { "type": "FOCUS_FEATURE", "featureId": "camera" }
                }
                """);

        AiChatResponse response = aiService.chat("smartphone-001", "Show me the camera");

        assertThat(response.message()).isEqualTo("Showing the Camera System.");
        assertThat(response.action()).isNotNull();
        assertThat(response.action().type()).isEqualTo("FOCUS_FEATURE");
        assertThat(response.action().featureId()).isEqualTo("camera");
        assertThat(response.action().enabled()).isNull();
    }

    @Test
    void explodeProduct_returnsExplodeAction() {
        aiProvider.setNextResponse("""
                {
                  "message": "Opening the exploded view.",
                  "action": { "type": "EXPLODE_PRODUCT" }
                }
                """);

        AiChatResponse response = aiService.chat("smartphone-001", "Explode the phone");

        assertThat(response.action()).isNotNull();
        assertThat(response.action().type()).isEqualTo("EXPLODE_PRODUCT");
        assertThat(response.action().featureId()).isNull();
    }

    @Test
    void explodeProduct_withFeatureId_isPreserved() {
        aiProvider.setNextResponse("""
                {
                  "message": "Opening the camera in exploded view.",
                  "action": { "type": "EXPLODE_PRODUCT", "featureId": "camera" }
                }
                """);

        AiChatResponse response = aiService.chat("smartphone-001", "Show me the camera in exploded view");

        assertThat(response.action()).isNotNull();
        assertThat(response.action().type()).isEqualTo("EXPLODE_PRODUCT");
        assertThat(response.action().featureId()).isEqualTo("camera");
    }

    @Test
    void assembleProduct_returnsAssembleAction() {
        aiProvider.setNextResponse("""
                {
                  "message": "Putting the phone back together.",
                  "action": { "type": "ASSEMBLE_PRODUCT" }
                }
                """);

        AiChatResponse response = aiService.chat("smartphone-001", "Put the phone back together");

        assertThat(response.action()).isNotNull();
        assertThat(response.action().type()).isEqualTo("ASSEMBLE_PRODUCT");
        assertThat(response.action().featureId()).isNull();
    }

    @Test
    void assembleProduct_withFeatureId_isPreserved() {
        aiProvider.setNextResponse("""
                {
                  "message": "Showing the display in assembled view.",
                  "action": { "type": "ASSEMBLE_PRODUCT", "featureId": "display" }
                }
                """);

        AiChatResponse response = aiService.chat("smartphone-001", "Show display in assembled mode");

        assertThat(response.action()).isNotNull();
        assertThat(response.action().type()).isEqualTo("ASSEMBLE_PRODUCT");
        assertThat(response.action().featureId()).isEqualTo("display");
    }

    @Test
    void assembleProduct_unknownFeatureId_stillAssembles() {
        aiProvider.setNextResponse("""
                {
                  "message": "Assembling the phone.",
                  "action": { "type": "ASSEMBLE_PRODUCT", "featureId": "warp-drive" }
                }
                """);

        AiChatResponse response = aiService.chat("smartphone-001", "Assemble the warp drive");

        assertThat(response.action()).isNotNull();
        assertThat(response.action().type()).isEqualTo("ASSEMBLE_PRODUCT");
        assertThat(response.action().featureId()).isNull();
    }

    @Test
    void showOverview_returnsOverviewAction() {
        aiProvider.setNextResponse("""
                {
                  "message": "Showing the full phone.",
                  "action": { "type": "SHOW_OVERVIEW" }
                }
                """);

        AiChatResponse response = aiService.chat("smartphone-001", "Show me the full phone");

        assertThat(response.action()).isNotNull();
        assertThat(response.action().type()).isEqualTo("SHOW_OVERVIEW");
        assertThat(response.action().featureId()).isNull();
    }

    @Test
    void toggleFlash_returnsEnabledTrue() {
        aiProvider.setNextResponse("""
                {
                  "message": "Turning on the flash.",
                  "action": { "type": "TOGGLE_FLASH", "enabled": true }
                }
                """);

        AiChatResponse response = aiService.chat("smartphone-001", "Turn on the flash");

        assertThat(response.action()).isNotNull();
        assertThat(response.action().type()).isEqualTo("TOGGLE_FLASH");
        assertThat(response.action().enabled()).isTrue();
    }

    @Test
    void invalidAction_isIgnored() {
        aiProvider.setNextResponse("""
                {
                  "message": "Done.",
                  "action": { "type": "DELETE_DATABASE" }
                }
                """);

        AiChatResponse response = aiService.chat("smartphone-001", "delete everything");

        assertThat(response.message()).isEqualTo("Done.");
        assertThat(response.action()).isNull();
    }

    @Test
    void missingProduct_throwsNotFound() {
        assertThatThrownBy(() -> aiService.chat("missing-product", "Show me the camera"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Product not found: missing-product");
    }

    @Test
    void unknownFeatureId_clearsAction() {
        aiProvider.setNextResponse("""
                {
                  "message": "Showing the warp drive.",
                  "action": { "type": "FOCUS_FEATURE", "featureId": "warp-drive" }
                }
                """);

        AiChatResponse response = aiService.chat("smartphone-001", "Show me the warp drive");

        assertThat(response.action()).isNull();
        assertThat(response.message()).isEqualTo("That component is not available on this product.");
    }

    @Test
    void televisionViewerAction_isRejected() {
        aiProvider.setNextResponse("""
                {
                  "message": "Opening exploded view.",
                  "action": { "type": "EXPLODE_PRODUCT" }
                }
                """);

        AiChatResponse response = aiService.chat("tv-001", "Explode the phone");

        assertThat(response.action()).isNull();
        assertThat(response.message()).contains("3D AI interactions are not currently available");
    }
}
