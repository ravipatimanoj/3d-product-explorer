package com.productexplorer.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void getAllProducts_returnsProducts() throws Exception {
        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id", is("smartphone-001")))
                .andExpect(jsonPath("$[0].name", is("Premium Flagship Smartphone")));
    }

    @Test
    void getProductById_returnsProduct() throws Exception {
        mockMvc.perform(get("/api/products/smartphone-001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is("smartphone-001")))
                .andExpect(jsonPath("$.category", is("Smartphone")))
                .andExpect(jsonPath("$.features", hasSize(12)));
    }

    @Test
    void getProductById_missingProduct_returns404() throws Exception {
        mockMvc.perform(get("/api/products/missing-product"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.message", is("Product not found: missing-product")));
    }

    @Test
    void getFeatures_returnsFeatures() throws Exception {
        mockMvc.perform(get("/api/products/smartphone-001/features"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(12)))
                .andExpect(jsonPath("$[0].id").exists())
                .andExpect(jsonPath("$[0].position.x").exists());
    }

    @Test
    void getFeatureById_returnsCameraFeature() throws Exception {
        mockMvc.perform(get("/api/products/smartphone-001/features/camera"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is("camera")))
                .andExpect(jsonPath("$.name", is("Camera System")))
                .andExpect(jsonPath("$.category", is("Camera")))
                .andExpect(jsonPath("$.modelNodeName", is("camera")))
                .andExpect(jsonPath("$.position.x", is(0.25)))
                .andExpect(jsonPath("$.position.y", is(1.2)))
                .andExpect(jsonPath("$.position.z", is(0.1)))
                .andExpect(jsonPath("$.cameraPosition.x", is(2.0)))
                .andExpect(jsonPath("$.specifications", hasSize(3)));
    }

    @Test
    void getFeatureById_missingFeature_returns404() throws Exception {
        mockMvc.perform(get("/api/products/smartphone-001/features/missing-feature")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.message", is("Feature not found: missing-feature for product: smartphone-001")));
    }
}
