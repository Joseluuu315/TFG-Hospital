package com.joseluu.hospital.error;

import com.joseluu.hospital.exception.NotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;

@SpringBootTest
@AutoConfigureMockMvc
@Import(GlobalExceptionHandlerTest.TestController.class)
class GlobalExceptionHandlerTest {

    @Autowired
    private MockMvc mvc;

    @Test
    void mapsNotFoundTo404WithEnvelope() throws Exception {
        mvc.perform(get("/test/notfound"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Recurso no encontrado"))
                .andExpect(jsonPath("$.path").value("/test/notfound"));
    }

    @Test
    void mapsIllegalArgumentTo400WithEnvelope() throws Exception {
        mvc.perform(get("/test/badrequest"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Entrada invalida"));
    }

    @Test
    void mapsValidationTo400WithViolations() throws Exception {
        mvc.perform(post("/test/validate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.violations").isArray())
                .andExpect(jsonPath("$.violations[0].field").value("name"));
    }

    @RestController
    @RequestMapping("/test")
    public static class TestController {
        @GetMapping("/notfound")
        public String notFound() {
            throw new NotFoundException("Recurso no encontrado");
        }

        @GetMapping("/badrequest")
        public String badRequest() {
            throw new IllegalArgumentException("Entrada invalida");
        }

        @PostMapping("/validate")
        public String validate(@Valid @RequestBody Payload payload) {
            return payload.name();
        }
    }

    record Payload(@NotBlank(message = "name es obligatorio") String name) {}
}
