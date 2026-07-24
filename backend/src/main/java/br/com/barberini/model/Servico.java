package br.com.barberini.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "servicos")
@Getter
@Setter
@NoArgsConstructor
public class Servico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal preco;

    /** Duração em minutos — define quantos slots o horário ocupa */
    @Column(nullable = false)
    private int duracaoMin = 30;

    @Column(nullable = false)
    private boolean ativo = true;

    public Servico(String nome, BigDecimal preco, int duracaoMin) {
        this.nome = nome;
        this.preco = preco;
        this.duracaoMin = duracaoMin;
    }
}
