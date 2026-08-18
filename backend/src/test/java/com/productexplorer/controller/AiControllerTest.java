package com.productexplorer.controller;

import com.productexplorer.service.RecordingAiProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Import(AiControllerTest.FakeAiConfig.class)
class AiControllerTest {

    @TestConfiguration
    static class FakeAiConfig {
        @Bean
        @Primary
        RecordingAiProvider recordingAiProvider() {
            return new RecordingAiProvider();
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RecordingAiProvider aiProvider;

    @BeforeEach
    void resetProvider() {
        aiProvider.setNextResponse("{\"message\":\"ok\",\"action\":null}");
    }

    @Test
    void chat_focusesCamera() throws Exception {
        aiProvider.setNextResponse("""
                {
                  "message": "Showing the Camera System.",
                  "action": { "type": "FOCUS_FEATURE", "featureId": "camera" }
                }
                """);

        mockMvc.perform(post("/api/ai/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"productId":"smartphone-001","message":"Show me the camera"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", is("Showing the Camera System.")))
                .andExpect(jsonPath("$.action.type", is("FOCUS_FEATURE")))
                .andExpect(jsonPath("$.action.featureId", is("camera")));
    }

    @Test
    void chat_missingProduct_returns404() throws Exception {
        mockMvc.perform(post("/api/ai/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"productId":"missing-product","message":"Hello"}
                                """))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.message", is("Product not found: missing-product")));
    }

    @Test
    void chat_colorsQuestion_returnsCatalogColorsWithoutAction() throws Exception {
        aiProvider.setNextResponse("""
                {
                  "message": "Available colors are Natural, Black, Silver, and Blue.",
                  "action": null
                }
                """);

        mockMvc.perform(post("/api/ai/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"productId":"smartphone-001","message":"What colors are available?"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", is("Available colors are Natural, Black, Silver, and Blue.")))
                .andExpect(jsonPath("$.action", nullValue()));
    }

    @Test
    void chat_explodeWithFeature_returnsFeatureId() throws Exception {
        aiProvider.setNextResponse("""
                {
                  "message": "Showing the camera in exploded view.",
                  "action": { "type": "EXPLODE_PRODUCT", "featureId": "camera" }
                }
                """);

        mockMvc.perform(post("/api/ai/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"productId":"smartphone-001","message":"Show me the camera in exploded view"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.action.type", is("EXPLODE_PRODUCT")))
                .andExpect(jsonPath("$.action.featureId", is("camera")));
    }

    @Test
    void chat_assembleWithFeature_returnsFeatureId() throws Exception {
        aiProvider.setNextResponse("""
                {
                  "message": "Showing the display in assembled view.",
                  "action": { "type": "ASSEMBLE_PRODUCT", "featureId": "display" }
                }
                """);

        mockMvc.perform(post("/api/ai/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"productId":"smartphone-001","message":"Show display in assembled mode"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.action.type", is("ASSEMBLE_PRODUCT")))
                .andExpect(jsonPath("$.action.featureId", is("display")));
    }
}
