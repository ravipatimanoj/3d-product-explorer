package com.productexplorer.service;

import com.productexplorer.domain.FeatureSpecification;
import com.productexplorer.domain.Position;
import com.productexplorer.domain.Product;
import com.productexplorer.domain.ProductFeature;

import java.util.List;

final class ProductCatalog {

    private ProductCatalog() {
    }

    static List<Product> createInitialCatalog() {
        return List.of(createSmartphone());
    }

    private static Product createSmartphone() {
        return new Product(
                "smartphone-001",
                "Premium Flagship Smartphone",
                "A premium flagship smartphone concept designed for an interactive 3D product experience.",
                "Smartphone",
                "Natural",
                List.of("Natural", "Black", "Silver", "Blue"),
                List.of(
                        createDisplayFeature(),
                        createCameraFeature(),
                        createFlashFeature(),
                        createFrameFeature(),
                        createActionButtonFeature(),
                        createVolumeButtonsFeature(),
                        createPowerButtonFeature(),
                        createUsbCFeature(),
                        createSpeakerFeature(),
                        createMicrophoneFeature(),
                        createBatteryFeature(),
                        createProcessorFeature()
                )
        );
    }

    private static ProductFeature createDisplayFeature() {
        return new ProductFeature(
                "display",
                "Display",
                "Edge-to-edge OLED panel with adaptive refresh and high peak brightness for outdoor visibility.",
                "Hardware",
                "display",
                new Position(0.0, 0.8, 0.05),
                new Position(0.0, 1.2, 2.5),
                List.of(
                        new FeatureSpecification("Panel Type", "OLED"),
                        new FeatureSpecification("Refresh Rate", "1-120 Hz adaptive"),
                        new FeatureSpecification("Peak Brightness", "2000 nits")
                )
        );
    }

    private static ProductFeature createCameraFeature() {
        return new ProductFeature(
                "camera",
                "Camera System",
                "Multi-lens rear camera array designed for versatile photography in varied lighting conditions.",
                "Camera",
                "camera",
                new Position(0.25, 1.2, 0.1),
                new Position(2.0, 1.5, 3.0),
                List.of(
                        new FeatureSpecification("Main Sensor", "48 MP wide"),
                        new FeatureSpecification("Ultra Wide", "12 MP"),
                        new FeatureSpecification("Optical Zoom", "5x telephoto")
                )
        );
    }

    private static ProductFeature createFlashFeature() {
        return new ProductFeature(
                "flash",
                "Flash",
                "Adaptive LED flash module that adjusts intensity based on scene distance and ambient light.",
                "Camera",
                "flash",
                new Position(0.35, 1.15, 0.08),
                new Position(1.8, 1.4, 2.8),
                List.of(
                        new FeatureSpecification("Type", "True Tone LED"),
                        new FeatureSpecification("Modes", "Auto, On, Off")
                )
        );
    }

    private static ProductFeature createFrameFeature() {
        return new ProductFeature(
                "frame",
                "Titanium Frame",
                "Lightweight titanium frame providing structural rigidity while keeping overall device weight low.",
                "Design",
                "frame",
                new Position(0.0, 0.5, 0.0),
                new Position(2.5, 1.0, 2.0),
                List.of(
                        new FeatureSpecification("Material", "Grade 5 titanium"),
                        new FeatureSpecification("Finish", "Brushed satin"),
                        new FeatureSpecification("Water Resistance", "IP68 rated")
                )
        );
    }

    private static ProductFeature createActionButtonFeature() {
        return new ProductFeature(
                "action-button",
                "Action Button",
                "Programmable side control that can trigger shortcuts, camera actions, or accessibility features.",
                "Controls",
                "action-button",
                new Position(-0.45, 0.9, 0.0),
                new Position(-1.5, 1.2, 2.0),
                List.of(
                        new FeatureSpecification("Input Type", "Press and hold"),
                        new FeatureSpecification("Customization", "User-configurable actions")
                )
        );
    }

    private static ProductFeature createVolumeButtonsFeature() {
        return new ProductFeature(
                "volume-buttons",
                "Volume Buttons",
                "Tactile volume controls with precise click feedback for audio adjustment.",
                "Controls",
                "volume-buttons",
                new Position(-0.48, 0.6, 0.0),
                new Position(-1.6, 1.0, 2.2),
                List.of(
                        new FeatureSpecification("Layout", "Dual-button rocker"),
                        new FeatureSpecification("Feedback", "Haptic click")
                )
        );
    }

    private static ProductFeature createPowerButtonFeature() {
        return new ProductFeature(
                "power-button",
                "Power Button",
                "Primary power and lock control integrated with biometric authentication sensors.",
                "Controls",
                "power-button",
                new Position(0.48, 0.7, 0.0),
                new Position(1.6, 1.1, 2.2),
                List.of(
                        new FeatureSpecification("Functions", "Power, lock, Siri activation"),
                        new FeatureSpecification("Biometrics", "Side-mounted fingerprint reader")
                )
        );
    }

    private static ProductFeature createUsbCFeature() {
        return new ProductFeature(
                "usb-c",
                "USB-C Port",
                "Universal USB-C port supporting fast charging and high-speed data transfer.",
                "Connectivity",
                "usb-c",
                new Position(0.0, -0.9, 0.0),
                new Position(0.0, -0.5, 2.5),
                List.of(
                        new FeatureSpecification("Standard", "USB-C 3.2"),
                        new FeatureSpecification("Charging", "Up to 27W wired"),
                        new FeatureSpecification("Data Transfer", "Up to 10 Gbps")
                )
        );
    }

    private static ProductFeature createSpeakerFeature() {
        return new ProductFeature(
                "speaker",
                "Speaker",
                "Stereo speaker system tuned for balanced playback across voice and media content.",
                "Audio",
                "speaker",
                new Position(0.2, -0.85, 0.05),
                new Position(1.0, -0.3, 2.8),
                List.of(
                        new FeatureSpecification("Configuration", "Stereo speakers"),
                        new FeatureSpecification("Audio Support", "Spatial audio playback")
                )
        );
    }

    private static ProductFeature createMicrophoneFeature() {
        return new ProductFeature(
                "microphone",
                "Microphone",
                "Multi-microphone array optimized for clear voice capture and noise reduction.",
                "Audio",
                "microphone",
                new Position(-0.2, -0.85, 0.05),
                new Position(-1.0, -0.3, 2.8),
                List.of(
                        new FeatureSpecification("Array Type", "Multi-mic beamforming"),
                        new FeatureSpecification("Use Cases", "Calls, video recording, voice assistant")
                )
        );
    }

    private static ProductFeature createBatteryFeature() {
        return new ProductFeature(
                "battery",
                "Battery",
                "High-density lithium-ion battery engineered for all-day usage under typical workloads.",
                "Internal",
                "battery",
                new Position(0.0, 0.0, -0.05),
                new Position(0.0, 0.5, 3.0),
                List.of(
                        new FeatureSpecification("Chemistry", "Lithium-ion"),
                        new FeatureSpecification("Capacity", "Approx. 4000 mAh"),
                        new FeatureSpecification("Wireless Charging", "MagSafe compatible")
                )
        );
    }

    private static ProductFeature createProcessorFeature() {
        return new ProductFeature(
                "processor",
                "Processor",
                "Advanced system-on-chip delivering efficient performance for apps, graphics, and on-device AI tasks.",
                "Internal",
                "processor",
                new Position(0.0, 0.2, -0.08),
                new Position(0.0, 0.8, 3.5),
                List.of(
                        new FeatureSpecification("Architecture", "6-core CPU"),
                        new FeatureSpecification("GPU", "5-core graphics"),
                        new FeatureSpecification("Neural Engine", "16-core ML accelerator")
                )
        );
    }
}
