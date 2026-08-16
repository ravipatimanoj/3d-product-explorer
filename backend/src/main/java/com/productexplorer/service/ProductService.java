package com.productexplorer.service;

import com.productexplorer.dto.ProductFeatureResponse;
import com.productexplorer.dto.ProductResponse;
import com.productexplorer.entity.ProductEntity;
import com.productexplorer.exception.ResourceNotFoundException;
import com.productexplorer.mapper.ProductMapper;
import com.productexplorer.repository.ProductFeatureRepository;
import com.productexplorer.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductFeatureRepository productFeatureRepository;
    private final ProductMapper productMapper;

    public ProductService(
            ProductRepository productRepository,
            ProductFeatureRepository productFeatureRepository,
            ProductMapper productMapper
    ) {
        this.productRepository = productRepository;
        this.productFeatureRepository = productFeatureRepository;
        this.productMapper = productMapper;
    }

    public List<ProductResponse> getAllProducts() {
        return productRepository.findAllByOrderByIdAsc().stream()
                .map(productMapper::toResponse)
                .toList();
    }

    public ProductResponse getProductById(String id) {
        return productMapper.toResponse(findProduct(id));
    }

    public List<ProductFeatureResponse> getFeatures(String productId) {
        ProductEntity product = findProduct(productId);
        return productMapper.toFeatureResponses(product.getFeatures());
    }

    public ProductFeatureResponse getFeatureById(String productId, String featureId) {
        findProduct(productId);
        return productFeatureRepository.findByProduct_IdAndId(productId, featureId)
                .map(productMapper::toResponse)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Feature not found: " + featureId + " for product: " + productId));
    }

    private ProductEntity findProduct(String id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
    }
}
