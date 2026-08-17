package com.productexplorer.service;

public interface AiProvider {

    String complete(String systemPrompt, String userMessage);
}
