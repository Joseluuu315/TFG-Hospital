package com.joseluu.hospital.service;

import jakarta.annotation.PreDestroy;
import org.springframework.stereotype.Component;

/*
Anotaciones obtenidas
 */
@Component
public class ShutdownService {
    @PreDestroy
    public void onShutDown (){
        System.out.println(
                "Prueba de evento que obtiene cierre de la web para cerrar shockets"
        );
    }
}
