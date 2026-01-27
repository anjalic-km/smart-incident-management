package com.smartims;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
public class IncidentManagementApplication {

	public static void main(String[] args) {
		SpringApplication.run(IncidentManagementApplication.class, args);

		@EnableScheduling
		@SpringBootApplication
        class SmartImsApplication {
		}

	}


}
