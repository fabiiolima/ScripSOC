let result = "";
let invalido = "";
var service = [];
var address_group = [];
var service_group = [];

const padrao_subnet = /^(\d{1,3}\.){3}\d{1,3}$/;
const padrao_mac = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
const padrao_fqdn = /[a-zA-Z].*\.[a-zA-Z].*/;
const padrao_subnet_mascara= /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2}$/;
const padrao_range = /^(\d{1,3}\.){3}\d{1,3}-(\d{1,3}\.){3}\d{1,3}$/;
const padrao_letras= /[a-zA-Z]/;
const padrao_wildcard = /'^\*\.'/;
const padrao_rang_portas = /\d*-\d*/;


function limparResultado() {
   	document.getElementById("result").value = "";
	result = "";
	address_group = [];
}

function copiarResultado() {
    var copyText = document.getElementById("result");

    copyText.select();

    document.execCommand("copy");

    alert("Texto copiado ! ");
}

function trata_address_group(address_group,nome_address_group) {
			
	address_group = String(address_group);
	address_group = address_group.replace(/,/g," ");
			
	result+=`config firewal addrgrp\n`;
	result+=`edit GrpH_${nome_address_group}\n`;
	result+=`append member ${address_group}\n`;
	result+=`end\n`;
	result+= `\n`;

}

function criar_portas(service,nome_address_group) {

	service = String(service);
	service = service.replace(/,/g," ");

	result += `config firewall service custom\n`
			
	const addresses = service.split(" ");
	addresses.forEach(address => {
		if (address == "icmp") {
					
			result += `edit "ALL_ICMP"\n`
			result += `set category "General"\n`
			result += `set protocol ICMP\n`
			result += `unset icmptype\n`
			result += `next\n`
			service_group.push(address);
					
		} else {
			result += `edit "Port_${address}"\n`
			result += `set tcp-portrange ${address}\n`
			result += `set udp-portrange ${address}\n`
			result += `next\n`
    		service_group.push(`Port_${address}`);
		}
	})

	result += `end\n`
	result+= `\n`


	service_group = String(service_group);
	service_group = service_group.replace(/,/g," ");

	result += `config firewall service group\n`;
	result += `edit ${nome_address_group}\n`;
   	result += `append member ${service_group}\n`;
    result += `next\n`;
	result += `end\n`;
}


function criar_fqdn(address) {
	address = address.replace("https://", "");
	address = address.replace("http://", "");
	address = address.replace("www.", "");

	let regex = /[:/].*/;
	let match = address.match(regex);
    		
	if (match) {
   		address = address.substring(0, match.index);
   	}

	result += `edit FQDN_${address}\n`;
	result += `set type fqdn\n`;
	result += `set fqdn ${address}\n`;
	result += `next\n`;

	address = `FQDN_${address}`;
	address_group.push(address);

}

function criar_subnet(address) {
	if (address.includes("/")) {
		const [ip, mask] = address.split("/");

		let mascaras = {
			"0": "0.0.0.0",
			"1": "128.0.0.0",
    	    "2": "192.0.0.0",
	        "3": "224.0.0.0",
		    "4": "240.0.0.0",
		    "5": "248.0.0.0",
		    "6": "252.0.0.0",
		    "7": "254.0.0.0",
		    "8": "255.0.0.0",
		    "9": "255.128.0.0",
		    "10": "255.192.0.0",
		    "11": "255.224.0.0",
		    "12": "255.240.0.0",
		    "13": "255.248.0.0",
		    "14": "255.252.0.0",
		    "15": "255.254.0.0",
		    "16": "255.255.0.0",
		    "17": "255.255.128.0",
		    "18": "255.255.192.0",
		    "19": "255.255.224.0",
		    "20": "255.255.240.0",
		    "21": "255.255.248.0",
		    "22": "255.255.252.0",
		    "23": "255.255.254.0",
		    "24": "255.255.255.0",
		    "25": "255.255.255.128",
		    "26": "255.255.255.192",
		    "27": "255.255.255.224",
		    "28": "255.255.255.240",
		    "29": "255.255.255.248",
		    "30": "255.255.255.252",
		    "31": "255.255.255.254",
		    "32": "255.255.255.255",
		};
	let mascara = mascaras[mask];
	result += `edit ${ip}/${mask}\n`;
		result += `set subnet ${ip}/${mascara}\n`;
		address = `${ip}${mask}`;
	} else {
		const mask=`255.255.255.255`;
		result += `edit ${address}/32\n`;
		result += `set subnet ${address}/${mask}\n`;
		address = `${address}/32`;
	};

			
    	address_group.push(address);
		result += `next\n`
		}

function criar_mac_address(address){
	address = address.replace(/-/g,":");
	result += `edit MAC_${address}\n`;
	result += `set type mac\n`;
	result += `set macaddr ${address}\n`;
	result += `next\n`;

	address = `MAC_${address}`;
	address_group.push(address);
}

function criar_range_ips(address){
	const [ip_inicial, ip_final] = address.split("-");

	result += `edit RngH_${address}\n`;
	result += `set type iprange\n`;
	result += `set start-ip ${ip_inicial}\n`;
	result += `set end-ip ${ip_inicial}\n`;
	result += `next\n`;

	address = `RngH_${address}`;
	address_group.push(address);
}


function main(){
			
	limparResultado()

	const ipAddresses = document.getElementById("ipAddresses").value;
	const nome_address_group = document.getElementById("nomegrupo").value;

	if (!nome_address_group.trim()) {
    	alert("Necessário preencher o campo 'Nome do grupo'.");
    	return;
	}
			

	result += `config firewall address\n`
	const addresses = ipAddresses.split("\n");
	addresses.forEach(address => {
		if (padrao_fqdn.test(address) || padrao_wildcard.test(address)) {
			criar_fqdn(address)
    	} else if (padrao_range.test(address)) {
			criar_range_ips(address)
		} else if (padrao_mac.test(address)) {
    	    criar_mac_address(address)
    	} else if (padrao_subnet.test(address) || padrao_subnet_mascara.test(address)) {
    	    criar_subnet(address)
    	} else if ((address >= 1 && address <= 65535) || (address.toLowerCase()=="icmp")) {
			service.push(address);
		} else if (padrao_rang_portas.test(address)) {
			service.push(address);
		} else {
    	    invalido += `${address} Inválido\n`;
    	}
	});
	
    result += `\n`
    result += `end\n`;
	
    if (!invalido == "") {
		alert(`${invalido}`);
	}
	
	trata_address_group(address_group,nome_address_group)

	if (service.length > 0) {
		criar_portas(service,nome_address_group)
	}

	document.getElementById("result").value = result;
}
