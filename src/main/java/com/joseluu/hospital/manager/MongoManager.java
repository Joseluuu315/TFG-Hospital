package com.joseluu.hospital.manager;

import com.joseluu.hospital.utils.ConfigUtils;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoDatabase;
import lombok.Getter;

public class MongoManager {
    @Getter
    MongoClient mongoClient;
    MongoDatabase mongoDatabase;

    /*
    START CONNECT AND DISCONNECT
     */
    public boolean startDatabase(){
        boolean status = false;

        try {
            mongoClient = MongoClients.create(ConfigUtils.uriMongo);
            mongoDatabase = mongoClient.getDatabase(ConfigUtils.nameDatabase);

            System.out.println("Database conectada sin errores");

            status  = true;
        }catch (Exception e){
            System.out.println(e.getMessage());
            status = false;
        }

        return status;
    }

    public void closeDatabase() {
        mongoClient.close();
        System.out.println("Database cerrada");
    }

    /*
    FINISH START AND DISCONNECT DATABASE
     */
}
