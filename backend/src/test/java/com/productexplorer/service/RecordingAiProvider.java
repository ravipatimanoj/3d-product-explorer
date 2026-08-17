package com.productexplorer.service;

public class RecordingAiProvider implements AiProvider {

    private String nextResponse = "{\"message\":\"ok\",\"action\":null}";
    private RuntimeException nextError;

    public void setNextResponse(String nextResponse) {
        this.nextResponse = nextResponse;
        this.nextError = null;
    }

    public void setNextError(RuntimeException nextError) {
        this.nextError = nextError;
    }

    @Override
    public String complete(String systemPrompt, String userMessage) {
        if (nextError != null) {
            throw nextError;
        }
        return nextResponse;
    }
}
