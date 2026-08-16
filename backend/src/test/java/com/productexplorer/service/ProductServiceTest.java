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

        assertThat(products).hasSize(3);
        assertThat(products).extracting(ProductResponse::id)
                .containsExactlyInAnyOrder("smartphone-001", "tv-001", "refrigerator-001");
        assertThat(products).filteredOn(product -> "smartphone-001".equals(product.id()))
                .extracting(ProductResponse::name)
                .containsExactly("Premium Flagship Smartphone");
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

    @Test
    void getProductById_returnsTelevision() {
        ProductResponse product = productService.getProductById("tv-001");

        assertThat(product.id()).isEqualTo("tv-001");
        assertThat(product.category()).isEqualTo("Television");
        assertThat(product.availableColors()).containsExactly("Graphite", "Silver", "Midnight", "Ivory");
        assertThat(product.features()).hasSize(10);
    }

    @Test
    void getProductById_returnsRefrigerator() {
        ProductResponse product = productService.getProductById("refrigerator-001");

        assertThat(product.id()).isEqualTo("refrigerator-001");
        assertThat(product.category()).isEqualTo("Refrigerator");
        assertThat(product.availableColors()).containsExactly(
                "Stainless Steel",
                "Black Stainless",
                "White",
                "Slate"
        );
        assertThat(product.features()).hasSize(10);
    }
}
