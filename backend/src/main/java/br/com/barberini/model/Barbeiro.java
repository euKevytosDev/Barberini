package br.com.barberini.model;

import jakarta.persistence.*;

@Entity
@Table(name = "barbeiros")
public class Barbeiro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String nome;

    @Column(nullable = false, length = 4)
    private String iniciais;

    @Column(nullable = false, length = 20)
    private String cor = "#3d3d3d";

    @Column(nullable = false)
    private boolean ativo = true;

    public Barbeiro() {}

    public Barbeiro(String nome, String iniciais, String cor) {
        this.nome = nome;
        this.iniciais = iniciais;
        this.cor = cor;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getIniciais() { return iniciais; }
    public void setIniciais(String iniciais) { this.iniciais = iniciais; }
    public String getCor() { return cor; }
    public void setCor(String cor) { this.cor = cor; }
    public boolean isAtivo() { return ativo; }
    public void setAtivo(boolean ativo) { this.ativo = ativo; }
}
