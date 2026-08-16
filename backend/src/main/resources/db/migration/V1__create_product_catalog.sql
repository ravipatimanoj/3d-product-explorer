CREATE TABLE products (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(64) NOT NULL,
    default_color VARCHAR(64) NOT NULL
);

CREATE TABLE product_colors (
    id BIGSERIAL PRIMARY KEY,
    product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    color_name VARCHAR(64) NOT NULL,
    sort_order INT NOT NULL,
    UNIQUE (product_id, color_name),
    UNIQUE (product_id, sort_order)
);

CREATE INDEX idx_product_colors_product_id ON product_colors(product_id);

CREATE TABLE product_features (
    id VARCHAR(64) NOT NULL,
    product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(64) NOT NULL,
    model_node_name VARCHAR(128) NOT NULL,
    sort_order INT NOT NULL,
    position_x DOUBLE PRECISION NOT NULL,
    position_y DOUBLE PRECISION NOT NULL,
    position_z DOUBLE PRECISION NOT NULL,
    camera_x DOUBLE PRECISION NOT NULL,
    camera_y DOUBLE PRECISION NOT NULL,
    camera_z DOUBLE PRECISION NOT NULL,
    PRIMARY KEY (product_id, id),
    UNIQUE (product_id, sort_order)
);

CREATE INDEX idx_product_features_product_id ON product_features(product_id);

CREATE TABLE feature_specifications (
    id BIGSERIAL PRIMARY KEY,
    product_id VARCHAR(64) NOT NULL,
    feature_id VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    value VARCHAR(255) NOT NULL,
    sort_order INT NOT NULL,
    FOREIGN KEY (product_id, feature_id)
        REFERENCES product_features(product_id, id)
        ON DELETE CASCADE,
    UNIQUE (product_id, feature_id, sort_order)
);

CREATE INDEX idx_feature_specifications_feature
    ON feature_specifications(product_id, feature_id);

INSERT INTO products (id, name, description, category, default_color)
VALUES (
    'smartphone-001',
    'Premium Flagship Smartphone',
    'A premium flagship smartphone concept designed for an interactive 3D product experience.',
    'Smartphone',
    'Natural'
);

INSERT INTO product_colors (product_id, color_name, sort_order)
VALUES
    ('smartphone-001', 'Natural', 1),
    ('smartphone-001', 'Black', 2),
    ('smartphone-001', 'Silver', 3),
    ('smartphone-001', 'Blue', 4);

INSERT INTO product_features (
    id,
    product_id,
    name,
    description,
    category,
    model_node_name,
    sort_order,
    position_x,
    position_y,
    position_z,
    camera_x,
    camera_y,
    camera_z
)
VALUES
    (
        'display',
        'smartphone-001',
        'Display',
        'Edge-to-edge OLED panel with adaptive refresh and high peak brightness for outdoor visibility.',
        'Hardware',
        'display',
        1,
        0.0,
        0.8,
        0.05,
        0.0,
        1.2,
        2.5
    ),
    (
        'camera',
        'smartphone-001',
        'Camera System',
        'Multi-lens rear camera array designed for versatile photography in varied lighting conditions.',
        'Camera',
        'camera',
        2,
        0.25,
        1.2,
        0.1,
        2.0,
        1.5,
        3.0
    ),
    (
        'flash',
        'smartphone-001',
        'Flash',
        'Adaptive LED flash module that adjusts intensity based on scene distance and ambient light.',
        'Camera',
        'flash',
        3,
        0.35,
        1.15,
        0.08,
        1.8,
        1.4,
        2.8
    ),
    (
        'frame',
        'smartphone-001',
        'Titanium Frame',
        'Lightweight titanium frame providing structural rigidity while keeping overall device weight low.',
        'Design',
        'frame',
        4,
        0.0,
        0.5,
        0.0,
        2.5,
        1.0,
        2.0
    ),
    (
        'action-button',
        'smartphone-001',
        'Action Button',
        'Programmable side control that can trigger shortcuts, camera actions, or accessibility features.',
        'Controls',
        'action-button',
        5,
        -0.45,
        0.9,
        0.0,
        -1.5,
        1.2,
        2.0
    ),
    (
        'volume-buttons',
        'smartphone-001',
        'Volume Buttons',
        'Tactile volume controls with precise click feedback for audio adjustment.',
        'Controls',
        'volume-buttons',
        6,
        -0.48,
        0.6,
        0.0,
        -1.6,
        1.0,
        2.2
    ),
    (
        'power-button',
        'smartphone-001',
        'Power Button',
        'Primary power and lock control integrated with biometric authentication sensors.',
        'Controls',
        'power-button',
        7,
        0.48,
        0.7,
        0.0,
        1.6,
        1.1,
        2.2
    ),
    (
        'usb-c',
        'smartphone-001',
        'USB-C Port',
        'Universal USB-C port supporting fast charging and high-speed data transfer.',
        'Connectivity',
        'usb-c',
        8,
        0.0,
        -0.9,
        0.0,
        0.0,
        -0.5,
        2.5
    ),
    (
        'speaker',
        'smartphone-001',
        'Speaker',
        'Stereo speaker system tuned for balanced playback across voice and media content.',
        'Audio',
        'speaker',
        9,
        0.2,
        -0.85,
        0.05,
        1.0,
        -0.3,
        2.8
    ),
    (
        'microphone',
        'smartphone-001',
        'Microphone',
        'Multi-microphone array optimized for clear voice capture and noise reduction.',
        'Audio',
        'microphone',
        10,
        -0.2,
        -0.85,
        0.05,
        -1.0,
        -0.3,
        2.8
    ),
    (
        'battery',
        'smartphone-001',
        'Battery',
        'High-density lithium-ion battery engineered for all-day usage under typical workloads.',
        'Internal',
        'battery',
        11,
        0.0,
        0.0,
        -0.05,
        0.0,
        0.5,
        3.0
    ),
    (
        'processor',
        'smartphone-001',
        'Processor',
        'Advanced system-on-chip delivering efficient performance for apps, graphics, and on-device AI tasks.',
        'Internal',
        'processor',
        12,
        0.0,
        0.2,
        -0.08,
        0.0,
        0.8,
        3.5
    );

INSERT INTO feature_specifications (product_id, feature_id, name, value, sort_order)
VALUES
    ('smartphone-001', 'display', 'Panel Type', 'OLED', 1),
    ('smartphone-001', 'display', 'Refresh Rate', '1-120 Hz adaptive', 2),
    ('smartphone-001', 'display', 'Peak Brightness', '2000 nits', 3),
    ('smartphone-001', 'camera', 'Main Sensor', '48 MP wide', 1),
    ('smartphone-001', 'camera', 'Ultra Wide', '12 MP', 2),
    ('smartphone-001', 'camera', 'Optical Zoom', '5x telephoto', 3),
    ('smartphone-001', 'flash', 'Type', 'True Tone LED', 1),
    ('smartphone-001', 'flash', 'Modes', 'Auto, On, Off', 2),
    ('smartphone-001', 'frame', 'Material', 'Grade 5 titanium', 1),
    ('smartphone-001', 'frame', 'Finish', 'Brushed satin', 2),
    ('smartphone-001', 'frame', 'Water Resistance', 'IP68 rated', 3),
    ('smartphone-001', 'action-button', 'Input Type', 'Press and hold', 1),
    ('smartphone-001', 'action-button', 'Customization', 'User-configurable actions', 2),
    ('smartphone-001', 'volume-buttons', 'Layout', 'Dual-button rocker', 1),
    ('smartphone-001', 'volume-buttons', 'Feedback', 'Haptic click', 2),
    ('smartphone-001', 'power-button', 'Functions', 'Power, lock, Siri activation', 1),
    ('smartphone-001', 'power-button', 'Biometrics', 'Side-mounted fingerprint reader', 2),
    ('smartphone-001', 'usb-c', 'Standard', 'USB-C 3.2', 1),
    ('smartphone-001', 'usb-c', 'Charging', 'Up to 27W wired', 2),
    ('smartphone-001', 'usb-c', 'Data Transfer', 'Up to 10 Gbps', 3),
    ('smartphone-001', 'speaker', 'Configuration', 'Stereo speakers', 1),
    ('smartphone-001', 'speaker', 'Audio Support', 'Spatial audio playback', 2),
    ('smartphone-001', 'microphone', 'Array Type', 'Multi-mic beamforming', 1),
    ('smartphone-001', 'microphone', 'Use Cases', 'Calls, video recording, voice assistant', 2),
    ('smartphone-001', 'battery', 'Chemistry', 'Lithium-ion', 1),
    ('smartphone-001', 'battery', 'Capacity', 'Approx. 4000 mAh', 2),
    ('smartphone-001', 'battery', 'Wireless Charging', 'MagSafe compatible', 3),
    ('smartphone-001', 'processor', 'Architecture', '6-core CPU', 1),
    ('smartphone-001', 'processor', 'GPU', '5-core graphics', 2),
    ('smartphone-001', 'processor', 'Neural Engine', '16-core ML accelerator', 3);
