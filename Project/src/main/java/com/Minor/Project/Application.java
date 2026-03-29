package com.Minor.Project;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import java.net.ServerSocket;

@SpringBootApplication
@EnableScheduling
public class Application {

	public static void main(String[] args) {
		SpringApplication app = new SpringApplication(Application.class);
		
		int port = 8081;
		int maxRetry = 10;
		boolean found = false;
		
		while (port < 8081 + maxRetry) {
			try (ServerSocket ss = new ServerSocket(port)) {
				found = true;
				break;
			} catch (Exception e) {
				System.out.println("Port " + port + " is in use. Switching to next available port...");
				port++;
			}
		}
		
		if (found) {
			System.setProperty("server.port", String.valueOf(port));
			System.out.println(">>> App starting on port: " + port);
		}
		
		app.run(args);
	}

}
