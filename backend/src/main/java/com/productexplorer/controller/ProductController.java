package com.productexplorer.controller;

import com.productexplorer.dto.ProductFeatureResponse;
import com.productexplorer.dto.ProductResponse;
import com.productexplorer.service.ProductService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public List<ProductResponse> getAllProducts() {
        return productService.getAllProducts();
    }

    @GetMapping("/{productId}")
    public ProductResponse getProductById(@PathVariable String productId) {
        return productService.getProductById(productId);
    }

    @GetMapping("/{productId}/features")
    public List<ProductFeatureResponse> getFeatures(@PathVariable String productId) {
        return productService.getFeatures(productId);
    }

    @GetMapping("/{productId}/features/{featureId}")
    public ProductFeatureResponse getFeatureById(
            @PathVariable String productId,
            @PathVariable String featureId
    ) {
        return productService.getFeatureById(productId, featureId);
    }
}
