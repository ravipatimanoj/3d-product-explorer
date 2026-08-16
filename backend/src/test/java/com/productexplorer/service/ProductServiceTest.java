package com.productexplorer.service;

import com.productexplorer.dto.ProductFeatureResponse;
import com.productexplorer.dto.ProductResponse;
import com.productexplorer.exception.ResourceNotFoundException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
class ProductServiceTest {

    @Autowired
    private ProductService productService;

    @Test
    void getAllProducts_returnsCatalog() {
        List<ProductResponse> products = productService.getAllProducts();

        assertThat(products).hasSize(1);
        assertThat(products.get(0).id()).isEqualTo("smartphone-001");
        assertThat(products.get(0).name()).isEqualTo("Premium Flagship Smartphone");
    }

    @Test
    void getProductById_returnsProduct() {
        ProductResponse product = productService.getProductById("smartphone-001");

        assertThat(product.id()).isEqualTo("smartphone-001");
        assertThat(product.category()).isEqualTo("Smartphone");
        assertThat(product.availableColors()).containsExactly("Natural", "Black", "Silver", "Blue");
        assertThat(product.features()).hasSize(12);
    }

    @Test
    void getProductById_missingProduct_throwsNotFound() {
        assertThatThrownBy(() -> productService.getProductById("missing-product"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Product not found: missing-product");
    }

    @Test
    void getFeatures_returnsAllFeatures() {
        List<ProductFeatureResponse> features = productService.getFeatures("smartphone-001");

        assertThat(features).hasSize(12);
        assertThat(features).extracting(ProductFeatureResponse::id)
                .contains("display", "camera", "battery", "processor");
    }

    @Test
    void getFeatureById_returnsFeature() {
        ProductFeatureResponse feature = productService.getFeatureById("smartphone-001", "camera");

        assertThat(feature.id()).isEqualTo("camera");
        assertThat(feature.name()).isEqualTo("Camera System");
        assertThat(feature.modelNodeName()).isEqualTo("camera");
        assertThat(feature.position().x()).isEqualTo(0.25);
        assertThat(feature.specifications()).hasSizeGreaterThanOrEqualTo(2);
    }

    @Test
    void getFeatureById_missingFeature_throwsNotFound() {
        assertThatThrownBy(() -> productService.getFeatureById("smartphone-001", "missing-feature"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessage("Feature not found: missing-feature for product: smartphone-001");
    }
}
