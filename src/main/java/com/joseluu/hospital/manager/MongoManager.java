package com.joseluu.hospital.manager;

import com.joseluu.hospital.utils.ConfigUtils;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoDatabase;
import lombok.Getter;

public class MongoManager {
    @Getter
    private MongoClient mongoClient;
    private MongoDatabase mongoDatabase;

    /*
    START CONNECT AND DISCONNECT
     */
    public void startDatabase(){
        try {
            mongoClient = MongoClients.create(ConfigUtils.uriMongo);
            mongoDatabase = mongoClient.getDatabase(ConfigUtils.nameDatabase);

            System.out.println("Database conectada sin errores");

        }catch (Exception e){
            System.out.println("Database conectada con errores");
            System.out.println(e.getMessage());
        }
    }

    public void closeDatabase() {
        mongoClient.close();
        System.out.println("Database cerrada");
    }

    /*
    FINISH START AND DISCONNECT DATABASE
     */
}
