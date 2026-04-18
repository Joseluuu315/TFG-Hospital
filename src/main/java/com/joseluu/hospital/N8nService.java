package com.joseluu.hospital;

import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;


@Service
public class N8nService {
    private final RestTemplate restTemplate;

    public N8nService(RestTemplate restTemplate) {
        this.restTemplate = new RestTemplate();
    }

    public void run() {

    }
}
